# Development Environment Outputs

# =============================================================================
# VPC Outputs
# =============================================================================
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# =============================================================================
# EKS Outputs
# =============================================================================
output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

# =============================================================================
# Database Outputs
# =============================================================================
output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.aurora.cluster_endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora reader endpoint"
  value       = module.aurora.reader_endpoint
}

output "opensearch_endpoint" {
  description = "OpenSearch domain endpoint"
  value       = module.opensearch.domain_endpoint
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.elasticache.primary_endpoint
}

# =============================================================================
# Messaging Outputs
# =============================================================================
output "msk_bootstrap_brokers" {
  description = "MSK bootstrap brokers"
  value       = module.msk.bootstrap_brokers
  sensitive   = true
}

# =============================================================================
# Auth Outputs
# =============================================================================
output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito user pool client ID"
  value       = module.cognito.user_pool_client_id
}

# =============================================================================
# Storage Outputs
# =============================================================================
output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = module.s3.bucket_names
}

# =============================================================================
# Grafana Exposure Outputs (NLB + CloudFront)
# =============================================================================
output "grafana_nlb_security_group_id" {
  description = "Security Group ID for Grafana NLB (use in K8s Service annotation)"
  value       = var.enable_grafana_external_access ? module.grafana_exposure[0].security_group_id : null
}

output "grafana_cloudfront_domain" {
  description = "CloudFront domain for Grafana"
  value       = var.enable_grafana_external_access ? module.grafana_exposure[0].cloudfront_domain_name : null
}

output "grafana_url" {
  description = "URL to access Grafana"
  value       = var.enable_grafana_external_access ? module.grafana_exposure[0].grafana_url : "Use kubectl port-forward svc/grafana -n monitoring 3000:3000"
}
