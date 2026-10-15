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

variable "encryption_key_ssm_path" {
  description = "SSM Parameter Store path for the AES-256 encryption key (SecureString)"
  type        = string
  default     = "/gift4event/encryption_key"
}
