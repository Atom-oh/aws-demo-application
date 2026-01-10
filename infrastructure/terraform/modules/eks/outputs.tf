# EKS Module Outputs

output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_security_group_id" {
  description = "Cluster security group ID"
  value       = aws_security_group.cluster.id
}

output "node_role_arn" {
  description = "Node IAM role ARN"
  value       = aws_iam_role.node.arn
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "OIDC provider URL"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "karpenter_role_arn" {
  description = "Karpenter IAM role ARN"
  value       = var.enable_karpenter ? aws_iam_role.karpenter[0].arn : null
}

output "keda_role_arn" {
  description = "KEDA IAM role ARN"
  value       = var.enable_keda ? aws_iam_role.keda[0].arn : null
}

output "cluster_version" {
  description = "EKS cluster version"
  value       = aws_eks_cluster.main.version
}
