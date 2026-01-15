# Outputs for Grafana Exposure Module

output "security_group_id" {
  description = "Security Group ID for NLB (use this in K8s Ingress annotation)"
  value       = aws_security_group.grafana_nlb.id
}

output "security_group_arn" {
  description = "Security Group ARN for NLB"
  value       = aws_security_group.grafana_nlb.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.grafana.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.grafana.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.grafana.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.grafana.hosted_zone_id
}

output "grafana_url" {
  description = "URL to access Grafana"
  value       = var.grafana_domain != "" ? "https://${var.grafana_domain}" : "https://${aws_cloudfront_distribution.grafana.domain_name}"
}

output "cloudfront_prefix_list_id" {
  description = "CloudFront managed prefix list ID (for reference)"
  value       = data.aws_ec2_managed_prefix_list.cloudfront.id
}
