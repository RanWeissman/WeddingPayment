# AWS IAM Least-Privilege & DynamoDB PITR Specification

## 1. Section Reference & Alignment
This specification aligns directly with **Sections 4, 5, and 7** of [`1_security_high_level.md`](./1_security_high_level.md):
1. **Section 4:** DynamoDB Point-in-Time Recovery (`PITR`)
2. **Section 5:** AWS IAM Least-Privilege Hardening (`GitHub Actions OIDC` & `Lambda CloudWatch Logs`)
3. **Section 7:** AWS Root Account Hardening (One-Time Manual Console Check)

Its objective is to lock down AWS identity permissions (`IAM`) to strict least privilege and protect the production database from accidental data loss at `$0.00` monthly cost.

---

## 2. Part A: GitHub Actions OIDC Branch Restriction (`terraform/main.tf`)

### What We Do
Update the `aws_iam_policy_document.github_assume_role` trust policy in `terraform/main.tf` so that only GitHub Actions workflows running on the `main` branch (`repo:${var.github_repository}:ref:refs/heads/main`) can assume the AWS deployment role.

### Why We Do It
Currently, the OIDC trust policy specifies `values = ["repo:${var.github_repository}:*"]` with `StringLike`. Because of the wildcard (`*`), any workflow triggered from an experimental feature branch, tag, or pull request within the repository can request temporary AWS credentials and modify production resources (`S3`, `CloudFront`, `DynamoDB`, `IAM`). Restricting the trust policy to `ref:refs/heads/main` ensures that only code merged into `main` can deploy to AWS.

### How It Works Under the Hood
When GitHub Actions starts a deployment job, GitHub's OIDC provider (`token.actions.githubusercontent.com`) issues a cryptographically signed JWT containing a `sub` (Subject) claim identifying the exact repository and Git reference (e.g., `repo:owner/repo:ref:refs/heads/main`). When GitHub calls `sts:AssumeRoleWithWebIdentity`, AWS IAM verifies that the `sub` claim in the token matches our exact condition string before issuing temporary credentials.

### How We Implement It (`terraform/main.tf`)
In `data "aws_iam_policy_document" "github_assume_role"`, replace `StringLike` + `repo:${var.github_repository}:*` with `StringEquals` + `repo:${var.github_repository}:ref:refs/heads/main`:
```hcl
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/main"]
    }
```

---

## 3. Part B: Scoping Lambda CloudWatch Logs Permissions (`terraform/api.tf` & `terraform/analytics.tf`)

### What We Do
Scope the CloudWatch Logs `Resource` ARN in both `aws_iam_role_policy.lambda_policy` (`terraform/api.tf`) and `aws_iam_role_policy.analytics_lambda_policy` (`terraform/analytics.tf`) from `arn:aws:logs:*:*:*` down to each Lambda function's specific Log Group ARN.

### Why We Do It (Least Privilege Principle)
While our Lambda roles already enforce strict least privilege for `DynamoDB` (only `PutItem` and `GetItem` on `Gift4Event-Configurations`) and `S3` (only `PutObject` on the analytics bucket), their logging permissions currently use `Resource = "arn:aws:logs:*:*:*"`. This allows either Lambda function to create log streams and write log events into **any** CloudWatch Log Group across the entire AWS account and all regions. Scoping the ARN ensures each Lambda can only write to its own dedicated log group.

### How It Works Under the Hood
AWS Lambda automatically writes `console.log` / `console.warn` / `console.error` output to a deterministic CloudWatch Log Group named `/aws/lambda/<function_name>`. By restricting the IAM policy `Resource` to `arn:aws:logs:<region>:<account_id>:log-group:/aws/lambda/<function_name>:*`, AWS IAM permits log creation and writing exclusively inside that function's log group.

### How We Implement It
1. **In `terraform/api.tf` (`aws_iam_role_policy.lambda_policy`):**
   ```hcl
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-api:*"
      },
   ```
2. **In `terraform/analytics.tf` (`aws_iam_role_policy.analytics_lambda_policy`):**
   ```hcl
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-analytics:*"
      },
   ```

---

## 4. Part C: DynamoDB Point-in-Time Recovery (`PITR`) (`terraform/api.tf`)

### What We Do
Enable `point_in_time_recovery` on `aws_dynamodb_table.config_table` (`Gift4Event-Configurations`) in `terraform/api.tf`.

### Why We Do It
Without PITR, if items in `Gift4Event-Configurations` are accidentally deleted or overwritten by an operational mistake, they cannot be recovered. Enabling PITR provides continuous, automatic backups of the table.

### How It Works Under the Hood
DynamoDB continuously tracks changes to the table behind the scenes with zero performance impact on read/write latency. If recovery is ever needed, AWS can restore the table to **any exact second** within the rolling 35-day window.
* **Cost Impact:** AWS charges `$0.20 per GB-month`. Because `Gift4Event-Configurations` stores compact JSON items (< 1 KB per wedding), total storage is `< 1 MB` (`< 0.001 GB`), which equals `~$0.0002/month` (`$0.00`).

### How We Implement It (`terraform/api.tf`)
```hcl
resource "aws_dynamodb_table" "config_table" {
  name         = "Gift4Event-Configurations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "slug"

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  attribute {
    name = "slug"
    type = "S"
  }
}
```

---

## 5. Part D: AWS Root Account Hardening (Manual One-Time Console Check)

### What We Do & Why
The AWS Account Root User has unrestricted administrative privileges that cannot be limited by IAM policies. In the AWS Management Console (`IAM -> Dashboard`), verify once:
1. **MFA on Root:** Multi-Factor Authentication is enabled on the Root account.
2. **Zero Root Access Keys:** No programmatic `Access Keys` (`AKIA...`) exist for the Root account.

---

## 6. How We Test & Verify It
1. **Terraform Validation:** Run `terraform validate` (or `terraform plan`) to confirm valid HCL syntax and resource references across `main.tf`, `api.tf`, and `analytics.tf`.
2. **Post-Deployment Verification:**
   * Verify in GitHub Actions that deployments from `main` succeed via OIDC.
   * Verify in CloudWatch Logs that `/aws/lambda/wedding-payment-api` and `/aws/lambda/wedding-payment-analytics` continue receiving logs normally.
   * Verify in the AWS DynamoDB Console (`Backups` tab of `Gift4Event-Configurations`) that **Point-in-time recovery (PITR)** status is **On**.
