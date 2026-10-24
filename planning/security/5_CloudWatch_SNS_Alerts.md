# Active Alerting on Suspicious Data Extraction (`CloudWatch + SNS`)

## 1. Section Reference & Alignment
This specification aligns with **Section 6 ("Active Alerting on Suspicious Data Extraction")** of [`1_security_high_level.md`](./1_security_high_level.md).

Its objective is to notify the system owner via email (AWS SNS) whenever an automated scraping attempt, brute-force attack, or unauthorized bulk table scan occurs—without incurring the cost or noise of logging every normal guest page view in CloudTrail Data Events.

---

## 2. Why Targeted Alarms Instead of CloudTrail Data Events
* **CloudTrail Data Events (`dynamodb:GetItem`):** Costs money and triggers on every legitimate wedding guest clicking "Reveal Bank Account".
* **CloudWatch Metric Filters + Alarms + SNS:**
  * **Cost:** `$0.00/month` (AWS Always Free Tier includes 10 CloudWatch Alarms, 5 GB of Log Ingestion, and 1,000 SNS email notifications per month).
  * **Signal-to-Noise:** Fires **only** when an attacker or scraper crosses your security thresholds or when someone attempts to dump the entire DynamoDB table.

---

## 3. Architectural Design

### Alert 1: API Scraping & Brute-Force Quarantine Alert
When an IP address triggers the 404 Brute-Force Quarantine (`15 misses in 60s`) or exceeds the bank-details reveal rate limit (`30 reveals/hour`) in `terraform/lambda/index.js`, the Lambda logs a structured warning:
* `Quarantined IP <ip> for 900s after 15 404 errors.`
* `Rate limit exceeded for IP <ip>` (to be logged when returning HTTP `429`).

We configure:
1. **`aws_cloudwatch_log_metric_filter`**: Watches `/aws/lambda/${var.project_name}-api` for `"Quarantined IP"` or `"Rate limit exceeded"`.
2. **`aws_cloudwatch_metric_alarm`**: Triggers whenever the metric count is `>= 1` within a 5-minute period (`300s`).
3. **`aws_sns_topic` + `aws_sns_topic_subscription`**: Sends an immediate email alert to the administrator.

---

### Alert 2: Unauthorized Bulk Table Scan Alert (`dynamodb:Scan`)
The Gift4Event application **never** calls `dynamodb:Scan`—it exclusively fetches individual items by primary key (`GetItem` via `slug`).
* If anyone runs a `Scan` against `Gift4Event-Configurations` (e.g., via AWS Console or a compromised credential attempting to dump all couples' data), DynamoDB automatically emits the `ReturnedItemCount` metric under the `Scan` operation.
* We configure an **`aws_cloudwatch_metric_alarm`** on `AWS/DynamoDB` (`MetricName = "ReturnedItemCount"`, `Operation = "Scan"`, `TableName = "Gift4Event-Configurations"`) with threshold `>= 1`, routing directly to the same SNS email topic.

---

## 4. Terraform Resources to Add (`terraform/api.tf` or `terraform/alerts.tf`)
1. `variable "alert_email"` in `terraform/variables.tf` (optional; if provided, creates the email subscription).
2. `aws_sns_topic.security_alerts` and `aws_sns_topic_subscription.security_email`.
3. `aws_cloudwatch_log_metric_filter.security_blocks` on `/aws/lambda/${var.project_name}-api`.
4. `aws_cloudwatch_metric_alarm.api_scraping_alarm` (triggers on `>= 1` block event).
5. `aws_cloudwatch_metric_alarm.dynamodb_scan_alarm` (triggers on `>= 1` scanned item on `Gift4Event-Configurations`).
