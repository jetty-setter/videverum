variable "aws_region" {
  description = "AWS region. CloudFront + ACM for CloudFront are always us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "site_bucket_name" {
  description = "S3 bucket that stores the built static site. Private; served only via CloudFront + OAC."
  type        = string
  default     = "videverum-prod-site"
}

variable "domain_names" {
  description = "CNAMEs served by the CloudFront distribution. DNS is at Namecheap (not managed here)."
  type        = list(string)
  default     = ["videverum.com", "www.videverum.com"]
}

variable "cloudfront_web_acl_arn" {
  description = <<-EOT
    WAFv2 (CLOUDFRONT scope) WebACL ARN attached to the distribution.
    Currently the console-auto-created "CreatedByCloudFront-361a05e5" (AWS managed
    rule groups). It costs ~$5/month, which dwarfs the rest of the VideVerum
    footprint, and was not a deliberate choice. Set to "" to detach it — a static
    S3+CloudFront site with no origin compute has minimal attack surface.
    Left attached here so `terraform apply` makes no surprise security change;
    flip it deliberately.
  EOT
  type        = string
  default     = "arn:aws:wafv2:us-east-1:936922781601:global/webacl/CreatedByCloudFront-361a05e5/68336f53-6dbd-4667-affc-c4cc513bf412"
}

variable "github_repo" {
  description = "owner/repo allowed to assume the deploy role via GitHub OIDC."
  type        = string
  default     = "jetty-setter/videverum"
}

variable "github_deploy_ref" {
  description = "Git ref allowed to assume the deploy role (exact match on the OIDC 'sub' claim)."
  type        = string
  default     = "refs/heads/main"
}
