variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "il-central-1"
}

variable "project_name" {
  description = "Base name for resources"
  type        = string
  default     = "wedding-payment"
}

variable "github_repository" {
  description = "The GitHub repository to trust for OIDC via GitHub Actions (format: org/repo)"
  type        = string
  default     = "RanWeissman/WeddingPayment"
}

variable "website_bucket_name" {
  description = "Globally unique name for the S3 bucket hosting the website"
  type        = string
  default     = "wedding-payment-site-ran-2026"
}

variable "encryption_key" {
  description = "Optional override for AES-256 encryption key (64-char hex). If empty, Terraform generates and persists a 256-bit key in encrypted S3 state."
  type        = string
  default     = ""
  sensitive   = true
}

variable "alert_email" {
  description = "Optional email address to receive AWS SNS security alerts (leave empty to configure later)"
  type        = string
  default     = ""
  sensitive   = true
}
