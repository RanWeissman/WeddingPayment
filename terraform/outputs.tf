output "website_bucket_name" {
  description = "The name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.id
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "github_actions_role_arn" {
  description = "The ARN of the GitHub Actions IAM Role (configure this in GHA secrets)"
  value       = aws_iam_role.github_actions.arn
}
