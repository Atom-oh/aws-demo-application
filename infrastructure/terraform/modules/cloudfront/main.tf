# CloudFront Module for HireHub
# Provides CloudFront distributions with custom domains for various services

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name = "${var.environment}-${var.project_name}"
  common_tags = merge(var.tags, {
    Module = "cloudfront"
  })
}

# ACM Certificate for CloudFront (must be in us-east-1)
data "aws_acm_certificate" "cloudfront" {
  provider    = aws.us_east_1
  domain      = var.domain_name
  statuses    = ["ISSUED"]
  most_recent = true
}

# Route53 Hosted Zone
data "aws_route53_zone" "main" {
  name         = var.hosted_zone_name
  private_zone = false
}

# =============================================================================
# CloudFront Distribution for Kong API Gateway (Unified: API + Frontend)
# =============================================================================

# Origin Access Control for S3 static assets (Kong distribution)
resource "aws_cloudfront_origin_access_control" "kong_s3" {
  count = var.create_kong_distribution && var.kong_s3_static_bucket_domain != "" ? 1 : 0

  name                              = "${local.name}-kong-s3-oac"
  description                       = "OAC for S3 static assets in Kong distribution"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "kong" {
  count = var.create_kong_distribution ? 1 : 0

  enabled         = true
  is_ipv6_enabled = true
  comment         = "${local.name}-kong-unified"
  price_class     = var.price_class
  aliases         = [var.kong_domain]

  # Origin 1: Kong NLB (API + SSR)
  origin {
    domain_name = var.kong_origin_domain
    origin_id   = "kong"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"  # NLB internal - no TLS cert
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Custom headers for origin verification
    custom_header {
      name  = "X-Origin-Verify"
      value = var.origin_verify_secret
    }
  }

  # Origin 2: S3 for static assets (if configured)
  dynamic "origin" {
    for_each = var.kong_s3_static_bucket_domain != "" ? [1] : []
    content {
      domain_name              = var.kong_s3_static_bucket_domain
      origin_id                = "s3-static"
      origin_access_control_id = aws_cloudfront_origin_access_control.kong_s3[0].id
    }
  }

  # Default: All requests go to Kong (API + Next.js SSR)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "kong"

    # No caching for dynamic content
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # _next/static/* - Immutable static assets (JS, CSS chunks) -> S3
  dynamic "ordered_cache_behavior" {
    for_each = var.kong_s3_static_bucket_domain != "" ? [1] : []
    content {
      path_pattern     = "/_next/static/*"
      allowed_methods  = ["GET", "HEAD"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "s3-static"

      cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
      origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin

      viewer_protocol_policy = "redirect-to-https"
      compress               = true
    }
  }

  # /images/* - Static images from S3
  dynamic "ordered_cache_behavior" {
    for_each = var.kong_s3_static_bucket_domain != "" ? [1] : []
    content {
      path_pattern     = "/images/*"
      allowed_methods  = ["GET", "HEAD"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "s3-static"

      cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
      origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin

      viewer_protocol_policy = "redirect-to-https"
      compress               = true
    }
  }

  # /favicon.ico - Static file from S3
  dynamic "ordered_cache_behavior" {
    for_each = var.kong_s3_static_bucket_domain != "" ? [1] : []
    content {
      path_pattern     = "/favicon.ico"
      allowed_methods  = ["GET", "HEAD"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "s3-static"

      cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized

      viewer_protocol_policy = "redirect-to-https"
      compress               = true
    }
  }

  # /robots.txt - Static file from S3
  dynamic "ordered_cache_behavior" {
    for_each = var.kong_s3_static_bucket_domain != "" ? [1] : []
    content {
      path_pattern     = "/robots.txt"
      allowed_methods  = ["GET", "HEAD"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "s3-static"

      cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized

      viewer_protocol_policy = "redirect-to-https"
      compress               = true
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  web_acl_id = var.kong_waf_acl_id

  tags = merge(local.common_tags, {
    Name    = "${local.name}-kong-cf"
    Service = "unified"
  })
}

# Route53 Record for Kong
resource "aws_route53_record" "kong" {
  count = var.create_kong_distribution ? 1 : 0

  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.kong_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.kong[0].domain_name
    zone_id                = aws_cloudfront_distribution.kong[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# =============================================================================
# CloudFront Distribution for Frontend (Next.js Hybrid: S3 + EKS SSR)
# =============================================================================
resource "aws_cloudfront_distribution" "frontend" {
  count = var.create_frontend_distribution ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name}-frontend-nextjs"
  default_root_object = ""
  price_class         = var.price_class
  aliases             = [var.frontend_domain]

  # Origin 1: S3 for static assets
  origin {
    domain_name              = var.frontend_s3_bucket_domain
    origin_id                = "s3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend[0].id
  }

  # Origin 2: EKS (ALB/NLB) for Next.js SSR
  origin {
    domain_name = var.frontend_ssr_origin_domain
    origin_id   = "eks-ssr"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"  # NLB internal - no TLS cert
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default: SSR via EKS (Next.js server handles routing)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "eks-ssr"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # _next/static/* - Immutable static assets (JS, CSS chunks)
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-static"

    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # _next/image/* - Next.js Image Optimization (SSR)
  ordered_cache_behavior {
    path_pattern     = "/_next/image*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "eks-ssr"

    # Cache optimized images for 1 day
    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # /images/* - Static images from S3
  ordered_cache_behavior {
    path_pattern     = "/images/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-static"

    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # /favicon.ico, /robots.txt, /sitemap.xml - Static files
  ordered_cache_behavior {
    path_pattern     = "/favicon.ico"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-static"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/robots.txt"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-static"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # /api/* - Next.js API Routes (SSR)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "eks-ssr"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  web_acl_id = var.frontend_waf_acl_id

  tags = merge(local.common_tags, {
    Name    = "${local.name}-frontend-cf"
    Service = "frontend"
  })
}

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "frontend" {
  count = var.create_frontend_distribution ? 1 : 0

  name                              = "${local.name}-frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Note: SPA routing function removed - Next.js SSR handles all routing

# Route53 Record for Frontend
resource "aws_route53_record" "frontend" {
  count = var.create_frontend_distribution ? 1 : 0

  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.frontend_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend[0].domain_name
    zone_id                = aws_cloudfront_distribution.frontend[0].hosted_zone_id
    evaluate_target_health = false
  }
}
