# Upgrade Plan - Infrastructure & Browser Security

This document outlines the core security solutions we will implement to harden the browser headers, API, and AWS infrastructure for Gift4Event, keeping the architecture lean, zero-cost (`$0.00/month`), and avoiding breaking changes.

## The Lean MVP Plan:

### 1. CloudFront HTTP Security Headers (`Response Headers Policy`)
**What it is:** Attaching an AWS-managed HTTP Response Headers Policy to the CloudFront distribution to return standard browser security headers on every response (`Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`).
**Why it's needed:** Protects guests from SSL stripping / Man-in-the-Middle attacks (`HSTS`), prevents malicious websites from embedding Gift4Event inside a hidden `<iframe>` (`Clickjacking`), prevents MIME-type sniffing, and prevents sensitive URL parameters from leaking in the `Referer` header when redirecting to external apps (Bit / PayBox).
**Implementation Approach:** Add `response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03"` (AWS Managed `SecurityHeadersPolicy`) under `default_cache_behavior` in `terraform/main.tf`.

### 2. Subresource Integrity (`SRI`) for External Scripts
**What it is:** Adding cryptographic hash verification (`integrity="sha384-..."` and `crossorigin="anonymous"`) to pinned third-party scripts loaded from public CDNs (`cdnjs` and `jsdelivr`).
**Why it's needed:** Ensures the browser refuses to execute external JavaScript libraries if a public CDN is compromised or the file contents are tampered with.
**Implementation Approach:** Add `integrity` and `crossorigin="anonymous"` attributes to the 4 versioned `<script>` tags in `index.html` (`qrcode.min.js`, `jsQR.min.js`, `jspdf.umd.min.js`, and `html2canvas.min.js`).

### 3. Rate Limiting on Event Creation (`POST /api/create`)
**What it is:** Restricting the number of new wedding payment pages a single IP address can create within a given timeframe (e.g., max 10 creations per IP per hour).
**Why it's needed:** While reading bank details is already rate-limited and existing slugs cannot be overwritten, `POST /api/create` is currently open to unlimited requests. Rate limiting creation prevents automated bots from spamming and inflating the DynamoDB table with fake events.
**Implementation Approach:** Extend the per-IP rate limiter in `terraform/lambda/index.js` (using a `ratelimit_create#<ip>` key prefix with a 1-hour TTL) before inserting a new item in `POST /api/create`.

### 4. DynamoDB Point-in-Time Recovery (`PITR`)
**What it is:** Enabling continuous automatic backups on the `Gift4Event-Configurations` DynamoDB table for a rolling 35-day window.
**Why it's needed:** Protects against accidental data deletion or corruption, allowing recovery to any second within the last 35 days.
**Implementation Approach:** Add `point_in_time_recovery { enabled = true }` to `aws_dynamodb_table.config_table` in `terraform/api.tf`.

### 5. AWS IAM Least-Privilege Hardening
**What it is:** Tightening IAM permissions for both the GitHub Actions OIDC deployment role and the Lambda execution roles.
**Why it's needed:** Currently, `terraform/main.tf` allows any Git branch (`repo:*`) to assume the AWS deployment role, and `terraform/api.tf` / `terraform/analytics.tf` allow CloudWatch Logs actions on `arn:aws:logs:*:*:*`. Restricting these enforces strict least privilege.
**Implementation Approach:** Restrict the GitHub OIDC `sub` condition in `terraform/main.tf` strictly to `repo:${var.github_repository}:ref:refs/heads/main`, and scope the CloudWatch Logs `Resource` ARN in `terraform/api.tf` and `terraform/analytics.tf` to the specific Lambda log groups (`/aws/lambda/${var.project_name}-*`).

### 6. Active Alerting on Suspicious Data Extraction (`CloudWatch Alarms + SNS`)
**What it is:** Automated email notifications triggered whenever anomalous data access, scraping attempts, or bulk table scans occur.
**Why it's needed:** AWS does not send alerts by default when someone attempts to scrape user payment details or scan/export a DynamoDB table. Targeted anomaly alarms provide immediate visibility into real attacks at zero cost (within the AWS Free Tier).
**Implementation Approach:** Configure a CloudWatch Log Metric Filter and Alarm on the API Lambda log group (`terraform/lambda/index.js`) to send an SNS email whenever an IP is quarantined (`Quarantined IP`) or hits the `429` rate limit, plus an alarm on DynamoDB `Scan` metrics (`ReturnedItemCount`) and table export events.

### 7. AWS Root Account Hardening (Manual Check)
**What it is:** Verifying in the AWS Management Console that the AWS Root User has Multi-Factor Authentication (`MFA`) enabled and zero active `Access Keys`.
**Why it's needed:** The Root user has unrestricted control over the entire AWS account; securing it with MFA and removing static keys is the most critical account-level safeguard.
**Implementation Approach:** Perform a one-time manual verification in the AWS Console IAM Dashboard.

### 8. Terms of Use, Privacy Consent & Liability Disclaimer (`Clickwrap`)
**What it is:** Requiring an explicit user consent checkbox (`Clickwrap`) before event creation, linked to a comprehensive Terms of Use & Privacy Policy modal (`frontend/terms-modal.js`).
**Why it's needed:** Protects the site owner from liability for user typos in bank/Bit/PayBox details, clarifies that Gift4Event is a technical display tool (`AS-IS`) rather than a financial intermediary, and fulfills informed-consent requirements under Israeli Privacy Protection Law (Amendment 13).
**Implementation Approach:** Create `frontend/terms-modal.js` with full legal terms, add the `#terms-consent` checkbox and `#terms-consent-error` alert banner above the submit button in `index.html`, and enforce custom validation in `frontend/app.js`.
