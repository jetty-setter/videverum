output "site_bucket_name" {
  description = "S3 bucket the deploy workflow syncs the built site into."
  value       = aws_s3_bucket.site.bucket
}

output "site_bucket_arn" {
  value = aws_s3_bucket.site.arn
}

output "cloudfront_distribution_id" {
  description = "Used for cache invalidation after a deploy."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_distribution_arn" {
  value = aws_cloudfront_distribution.site.arn
}

output "cloudfront_domain_name" {
  description = "*.cloudfront.net domain the Namecheap records point at."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "deploy_role_arn" {
  description = "Set as the GitHub Actions variable AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.deploy.arn
}

output "acm_certificate_arn" {
  value = data.aws_acm_certificate.site.arn
}
