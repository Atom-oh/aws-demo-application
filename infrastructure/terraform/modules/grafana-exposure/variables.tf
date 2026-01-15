# Variables for Grafana Exposure Module

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "hirehub"
}

variable "vpc_id" {
  description = "VPC ID where the security group will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block (for NLB health checks)"
  type        = string
}

# NLB Configuration
variable "nlb_dns_name" {
  description = "DNS name of the NLB (created by AWS LB Controller)"
  type        = string
}

variable "nlb_https_enabled" {
  description = "Whether NLB has HTTPS listener enabled"
  type        = bool
  default     = false
}

# CloudFront Configuration
variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_200" # Asia, Europe, North America
}

variable "grafana_domain" {
  description = "Custom domain for Grafana (e.g., grafana.hirehub.example.com). Leave empty for CloudFront default domain."
  type        = string
  default     = ""
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name (required if grafana_domain is set)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "origin_verify_secret" {
  description = "Secret header value for origin verification"
  type        = string
  default     = ""
  sensitive   = true
}

variable "waf_acl_id" {
  description = "WAF Web ACL ID to associate with CloudFront"
  type        = string
  default     = null
}

# Geo Restriction
variable "geo_restriction_type" {
  description = "Geo restriction type (none, whitelist, blacklist)"
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo restriction"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
