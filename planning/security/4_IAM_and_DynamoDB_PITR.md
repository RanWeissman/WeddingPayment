# AWS IAM Least-Privilege & DynamoDB PITR Specification

## 1. Section Reference & Alignment
This specification aligns with **Sections 4, 5, and 7** of [`1_security_high_level.md`](./1_security_high_level.md):
* **Section 4:** DynamoDB Point-in-Time Recovery (`PITR`)
* **Section 5:** AWS IAM Least-Privilege Hardening (Terraform)
* **Section 7:** AWS Root Account Hardening (Manual Console Check)

---

## 2. DynamoDB Point-in-Time Recovery (`terraform/api.tf`)

### Objective
Enable continuous automatic backups for the `Gift4Event-Configurations` table so that accidental deletion or corruption can be restored to any second within the preceding 35 days.

### Cost Impact
AWS charges `$0.20 per GB-month` for PITR. Because `Gift4Event-Configurations` stores small JSON records (< 1 KB per wedding) with TTL enabled, total table size is under `1 MB` (`< 0.001 GB`), resulting in a monthly cost of `~$0.0002` (`$0.00`).

### Terraform Change (`terraform/api.tf`)
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

## 3. AWS IAM Least-Privilege Hardening

### A. Restrict GitHub Actions OIDC Trust Policy to `main` Branch (`terraform/main.tf`)
* **Current State:**
  In `data "aws_iam_policy_document" "github_assume_role"`, the `sub` condition is set to:
  ```hcl
  values = ["repo:${var.github_repository}:*"]
  ```
  This allows workflows triggered from any non-main branch, tag, or pull request environment in the repository to assume the AWS deployment role.
* **Target State:**
  Restrict role assumption exclusively to pushes/workflows running on the `main` branch:
  ```hcl
  condition {
    test     = "StringEquals"
    variable = "token.actions.githubusercontent.com:sub"
    values   = ["repo:${var.github_repository}:ref:refs/heads/main"]
  }
  ```

### B. Scope Lambda CloudWatch Logs Permissions (`terraform/api.tf` & `terraform/analytics.tf`)
* **Current State:**
  Both `aws_iam_role_policy.lambda_policy` (`api.tf`) and `aws_iam_role_policy.analytics_lambda_policy` (`analytics.tf`) grant `logs:CreateLogGroup`, `logs:CreateLogStream`, and `logs:PutLogEvents` on `Resource = "arn:aws:logs:*:*:*"`.
* **Target State:**
  Scope the `Resource` ARN strictly to the specific Lambda function's log group:
  * In `terraform/api.tf`:
    ```hcl
    Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-api:*"
    ```
  * In `terraform/analytics.tf`:
    ```hcl
    Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-analytics:*"
    ```

---

## 4. AWS Root Account Hardening (One-Time Manual Verification)
Verify in the AWS Management Console (`IAM -> Dashboard`):
1. **Root MFA:** Confirm that Multi-Factor Authentication (Authenticator app or Passkey/FIDO2 security key) is active on the Root user.
2. **Root Access Keys:** Confirm that the Root user has **0 active Access Keys**.
