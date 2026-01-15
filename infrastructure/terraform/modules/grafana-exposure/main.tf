# Grafana Exposure Module
# NLB + CloudFront with Security Group allowing only CloudFront IPs

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name = "${var.environment}-${var.project_name}-grafana"
  common_tags = merge(var.tags, {
    Module  = "grafana-exposure"
    Service = "grafana"
  })
}

# =============================================================================
# CloudFront Managed Prefix List (for Security Group)
# =============================================================================
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

# =============================================================================
# Security Group for NLB - Only allows CloudFront IPs
# =============================================================================
resource "aws_security_group" "grafana_nlb" {
  name        = "${local.name}-nlb-sg"
  description = "Security group for Grafana NLB - CloudFront only"
  vpc_id      = var.vpc_id

  # Allow HTTP from CloudFront only (NLB listens on port 80)
  # Note: CloudFront prefix list has many entries, may hit SG rules limit
  ingress {
    description     = "HTTP from CloudFront"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  # Allow HTTP from VPC for NLB health checks
  # NLB health checks come from ENIs within the VPC, not from CloudFront
  ingress {
    description = "NLB Health Checks from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # Egress - allow all outbound
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-nlb-sg"
  })
}

# =============================================================================
# CloudFront Distribution for Grafana
# =============================================================================
resource "aws_cloudfront_distribution" "grafana" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${local.name}-dashboard"
  price_class     = var.price_class
  aliases         = var.grafana_domain != "" ? [var.grafana_domain] : []

  origin {
    domain_name = var.nlb_dns_name
    origin_id   = "grafana-nlb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = var.nlb_https_enabled ? "https-only" : "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      # NLB health check
      origin_read_timeout    = 60
      origin_keepalive_timeout = 60
    }

    # Origin verification header (optional security layer)
    dynamic "custom_header" {
      for_each = var.origin_verify_secret != "" ? [1] : []
      content {
        name  = "X-Origin-Verify"
        value = var.origin_verify_secret
      }
    }
  }

  # Default behavior - Grafana dashboard (no caching for dynamic content)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "grafana-nlb"

    # No caching for Grafana (real-time dashboards)
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # Static assets - cache for performance
  ordered_cache_behavior {
    path_pattern     = "/public/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "grafana-nlb"

    # Cache static assets (JS, CSS, images)
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # API endpoints - no caching
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "grafana-nlb"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # WebSocket for live dashboards
  ordered_cache_behavior {
    path_pattern     = "/api/live/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "grafana-nlb"

    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3" # AllViewer

    viewer_protocol_policy = "redirect-to-https"
    compress               = false # WebSocket doesn't benefit from compression
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  # Use default CloudFront certificate if no custom domain
  dynamic "viewer_certificate" {
    for_each = var.grafana_domain != "" ? [] : [1]
    content {
      cloudfront_default_certificate = true
    }
  }

  # Use ACM certificate for custom domain
  dynamic "viewer_certificate" {
    for_each = var.grafana_domain != "" ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  # WAF integration (optional)
  web_acl_id = var.waf_acl_id

  tags = merge(local.common_tags, {
    Name = "${local.name}-cf"
  })
}

# =============================================================================
# Route53 Record (optional - if custom domain provided)
# =============================================================================
data "aws_route53_zone" "main" {
  count = var.grafana_domain != "" && var.hosted_zone_name != "" ? 1 : 0

  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_route53_record" "grafana" {
  count = var.grafana_domain != "" && var.hosted_zone_name != "" ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.grafana_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.grafana.domain_name
    zone_id                = aws_cloudfront_distribution.grafana.hosted_zone_id
    evaluate_target_health = false
  }
}
