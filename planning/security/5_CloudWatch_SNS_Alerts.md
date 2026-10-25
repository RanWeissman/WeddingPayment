# Active Alerting on Suspicious Data Extraction (`CloudWatch + SNS`)

## 1. Section Reference & Alignment
This specification aligns directly with **Section 6 ("Active Alerting on Suspicious Data Extraction")** of [`1_security_high_level.md`](./1_security_high_level.md).

Its objective is to notify the system owner in real time via AWS SNS (email) whenever an automated scraping attempt, brute-force attack, or unauthorized bulk table scan (`dynamodb:Scan`) occurs—without incurring the cost or noise of logging every normal guest page view in CloudTrail Data Events.

---

## 2. What We Do
Provision an automated, zero-cost (`$0.00/month`) security alerting pipeline in Terraform consisting of:
1. **An AWS SNS Topic (`${var.project_name}-security-alerts`)** with an optional email subscription (`var.alert_email`).
2. **An Explicit CloudWatch Log Group (`/aws/lambda/${var.project_name}-api`)** with a 30-day retention policy.
3. **Alert 1 — API Scraping & Quarantine Alarm (`aws_cloudwatch_log_metric_filter` + `aws_cloudwatch_metric_alarm`):** Detects whenever the API Lambda quarantines a brute-force IP (`"Quarantined IP"`) or blocks an IP for exceeding rate limits (`"Rate limit exceeded"`).
4. **Alert 2 — Bulk DynamoDB Table Scan Alarm (`aws_cloudwatch_metric_alarm`):** Detects whenever `ReturnedItemCount` under the `Scan` operation on `Gift4Event-Configurations` is `>= 1`.
5. **CI/CD IAM Permissions (`terraform/main.tf`):** Add `cloudwatch:*` and `sns:*` to `aws_iam_policy_document.github_actions_policy` so GitHub Actions can provision and manage these alarms.

---

## 3. Why We Do It
1. **Real-Time Visibility Into Blocked Attacks:**
   While `terraform/lambda/index.js` already blocks brute-force scanners (`403`) and rate-limit violators (`429`) automatically, those events are currently written silently to CloudWatch Logs. Without an active alarm, the system owner has no visibility when an attack is underway.
2. **Immediate Detection of Unauthorized Database Dumps (`Scan`):**
   The Gift4Event application **never** calls `dynamodb:Scan`—it exclusively fetches single items by primary key (`GetItem` via `slug`). Therefore, any `Scan` operation on `Gift4Event-Configurations` indicates someone is inspecting or dumping the table outside normal application flow (e.g., via AWS Console or CLI).
3. **Why CloudWatch Metric Alarms Instead of CloudTrail Data Events:**
   * **CloudTrail Data Events (`dynamodb:GetItem`):** Costs money and triggers on every legitimate wedding guest clicking "Reveal Bank Account".
   * **CloudWatch Metric Filters + Alarms + SNS:** Stays 100% within the **AWS Always Free Tier** (10 free alarms, 5 GB log ingestion, 1,000 free SNS email deliveries/month) and triggers **only** on genuine security anomalies.

---

## 4. How It Works Under the Hood

### Flow 1: API Brute-Force & Rate-Limit Detection
1. When an attacker triggers 15 missing-slug (`404`) errors in 60 seconds, or exceeds 30 bank-detail reveals / 10 event creations in an hour, `terraform/lambda/index.js` logs a warning via `console.warn`:
   * `Quarantined IP <ip> for 900s after 15 404 errors.`
   * `Rate limit exceeded for IP <ip> on prefix <prefix>`
2. CloudWatch Logs streams these log lines into `/aws/lambda/${var.project_name}-api`.
3. Our **CloudWatch Log Metric Filter** (`?"Quarantined IP" ?"Rate limit exceeded"`) evaluates incoming log lines in real time and increments custom metric `SecurityBlockCount` (in namespace `Gift4Event/Security`) by `1` whenever either phrase appears.
4. Our **CloudWatch Metric Alarm** evaluates `Sum(SecurityBlockCount)` over 5-minute (`300s`) periods (`treat_missing_data = "notBreaching"`). As soon as `Sum >= 1`, the alarm transitions to `ALARM` state and publishes a notification to the SNS Topic.

### Flow 2: Bulk Table Scan Detection (`dynamodb:Scan`)
1. AWS DynamoDB automatically publishes operational metrics to the `AWS/DynamoDB` CloudWatch namespace at no extra charge.
2. Whenever a `Scan` operation is executed on `Gift4Event-Configurations`, DynamoDB records the number of items read in the `ReturnedItemCount` metric.
3. Our **CloudWatch Metric Alarm** monitors `ReturnedItemCount` for `TableName = "Gift4Event-Configurations"`. If `Sum >= 1` within any 5-minute window, it immediately transitions to `ALARM` state and publishes an alert to the SNS Topic.

---

## 5. How We Implement It (Exact Code Changes)

### A. Add `alert_email` Variable (`terraform/variables.tf`)
```hcl
variable "alert_email" {
  description = "Optional email address to receive AWS SNS security alerts (leave empty to skip email subscription)"
  type        = string
  default     = ""
}
```

### B. Add Security Alerts Resources (`terraform/api.tf`)
```hcl
# ----------------------------------------------------
# Security Monitoring & SNS Alerts (Security Section 6)
# ----------------------------------------------------
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api_handler.function_name}"
  retention_in_days = 30
}

resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-security-alerts"
}

resource "aws_sns_topic_subscription" "security_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_log_metric_filter" "security_blocks" {
  name           = "${var.project_name}-security-blocks"
  pattern        = "?\"Quarantined IP\" ?\"Rate limit exceeded\""
  log_group_name = aws_cloudwatch_log_group.api_logs.name

  metric_transformation {
    name          = "SecurityBlockCount"
    namespace     = "Gift4Event/Security"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_scraping_alarm" {
  alarm_name          = "${var.project_name}-api-scraping-detected"
  alarm_description   = "Triggers when an IP is quarantined for 404 brute-forcing or exceeds API rate limits"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "SecurityBlockCount"
  namespace           = "Gift4Event/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_scan_alarm" {
  alarm_name          = "${var.project_name}-dynamodb-bulk-scan-detected"
  alarm_description   = "Triggers if a bulk Scan operation returns items from Gift4Event-Configurations"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ReturnedItemCount"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.config_table.name
  }

  alarm_actions = [aws_sns_topic.security_alerts.arn]
}
```

### C. Update GitHub Actions Deployment Policy (`terraform/main.tf`)
Add `"cloudwatch:*"` and `"sns:*"` to `AllowTerraformManageResources` in `data "aws_iam_policy_document" "github_actions_policy"`.

---

## 6. How We Test & Verify It
1. **SNS Subscription Confirmation:** If `alert_email` is set, click **"Confirm subscription"** in the email sent by AWS SNS after deployment.
2. **Test Alert 1 (API Scraping Alarm):** Trigger 15 requests to a non-existent slug (e.g., `https://www.gift4event.com/api/config/non-existent-test-slug`) within 60 seconds -> verify the IP receives `403 Forbidden`, CloudWatch increments `SecurityBlockCount`, and the `wedding-payment-api-scraping-detected` alarm fires.
3. **Test Alert 2 (DynamoDB Scan Alarm):** Open the AWS DynamoDB Console -> click **"Explore table items"** on `Gift4Event-Configurations` (which runs a `Scan` by default) -> verify the `wedding-payment-dynamodb-bulk-scan-detected` alarm fires within 5 minutes.
