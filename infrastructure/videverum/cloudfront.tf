locals {
  origin_id = "videverum-prod-site-s3"
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "videverum-prod-site"
  description                       = "OAC for the videverum-prod-site S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Imported from the existing distribution E3RPD0J7B54UZT (see README "Import").
# Same distribution, same aliases, same ACM cert, reconfigured for a private
# S3 REST origin behind OAC.
#
# price_class is intentionally not set: this distribution is on CloudFront's
# "Free" pricing plan, which rejects an explicit price class. The free plan
# already caps billable usage, so this is cheaper than PriceClass_100 anyway.
resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = ""
  aliases             = var.domain_names
  http_version        = "http2"
  default_root_object = "index.html"
  web_acl_id          = var.cloudfront_web_acl_arn

  origin {
    origin_id                = local.origin_id
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Managed-CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # SPA deep-link fallback: S3 returns 403 for missing keys (with OAC), 404 for
  # missing objects — serve index.html and let the client router take over.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.site.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
