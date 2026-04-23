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
