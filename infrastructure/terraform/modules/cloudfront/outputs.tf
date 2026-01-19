# CloudFront Module Outputs

# =============================================================================
# Kong Distribution Outputs
# =============================================================================
output "kong_distribution_id" {
  description = "CloudFront distribution ID for Kong"
  value       = var.create_kong_distribution ? aws_cloudfront_distribution.kong[0].id : null
}

output "kong_distribution_domain_name" {
  description = "CloudFront distribution domain name for Kong"
  value       = var.create_kong_distribution ? aws_cloudfront_distribution.kong[0].domain_name : null
}

output "kong_distribution_arn" {
  description = "CloudFront distribution ARN for Kong"
  value       = var.create_kong_distribution ? aws_cloudfront_distribution.kong[0].arn : null
}

output "kong_url" {
  description = "Full URL for Kong API"
  value       = var.create_kong_distribution ? "https://${var.kong_domain}" : null
}

output "kong_s3_oac_id" {
  description = "Origin Access Control ID for S3 static assets in Kong distribution"
  value       = var.create_kong_distribution && var.kong_s3_static_bucket_domain != "" ? aws_cloudfront_origin_access_control.kong_s3[0].id : null
}

# =============================================================================
# Frontend Distribution Outputs
# =============================================================================
output "frontend_distribution_id" {
  description = "CloudFront distribution ID for Frontend"
  value       = var.create_frontend_distribution ? aws_cloudfront_distribution.frontend[0].id : null
}

output "frontend_distribution_domain_name" {
  description = "CloudFront distribution domain name for Frontend"
  value       = var.create_frontend_distribution ? aws_cloudfront_distribution.frontend[0].domain_name : null
}

output "frontend_distribution_arn" {
  description = "CloudFront distribution ARN for Frontend"
  value       = var.create_frontend_distribution ? aws_cloudfront_distribution.frontend[0].arn : null
}

output "frontend_url" {
  description = "Full URL for Frontend"
  value       = var.create_frontend_distribution ? "https://${var.frontend_domain}" : null
}

output "frontend_oac_id" {
  description = "Origin Access Control ID for Frontend S3 bucket"
  value       = var.create_frontend_distribution ? aws_cloudfront_origin_access_control.frontend[0].id : null
}
