# CloudFront Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for ACM certificate lookup (e.g., *.aws.atomai.click)"
  type        = string
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name (e.g., aws.atomai.click)"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_200" # US, Canada, Europe, Asia, Middle East, Africa
}

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

# =============================================================================
# Kong API Gateway Distribution Settings
# =============================================================================
variable "create_kong_distribution" {
  description = "Whether to create CloudFront distribution for Kong API Gateway"
  type        = bool
  default     = false
}

variable "kong_domain" {
  description = "Custom domain for Kong API (e.g., api.aws.atomai.click)"
  type        = string
  default     = ""
}

variable "kong_origin_domain" {
  description = "Origin domain for Kong (NLB DNS name)"
  type        = string
  default     = ""
}

variable "kong_waf_acl_id" {
  description = "WAF Web ACL ID for Kong distribution"
  type        = string
  default     = null
}

variable "origin_verify_secret" {
  description = "Secret header value for origin verification"
  type        = string
  default     = ""
  sensitive   = true
}

# =============================================================================
# Frontend Distribution Settings
# =============================================================================
variable "create_frontend_distribution" {
  description = "Whether to create CloudFront distribution for Frontend"
  type        = bool
  default     = false
}

variable "frontend_domain" {
  description = "Custom domain for Frontend (e.g., app.aws.atomai.click)"
  type        = string
  default     = ""
}

variable "frontend_s3_bucket_domain" {
  description = "S3 bucket regional domain name for frontend static assets (_next/static, images)"
  type        = string
  default     = ""
}

variable "frontend_ssr_origin_domain" {
  description = "EKS ALB/NLB DNS name for Next.js SSR origin"
  type        = string
  default     = ""
}

variable "frontend_waf_acl_id" {
  description = "WAF Web ACL ID for Frontend distribution"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
