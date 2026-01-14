# EKS ArgoCD Capability Module Outputs

output "capability_arn" {
  description = "ARN of the ArgoCD capability"
  value       = aws_eks_capability.argocd.arn
}

output "server_url" {
  description = "URL of the ArgoCD server (use this to access the ArgoCD web UI)"
  value       = aws_eks_capability.argocd.configuration[0].argo_cd[0].server_url
}

output "version" {
  description = "Version of the ArgoCD capability"
  value       = aws_eks_capability.argocd.version
}

output "role_arn" {
  description = "IAM role ARN used by the ArgoCD capability"
  value       = aws_iam_role.argocd_capability.arn
}

output "namespace" {
  description = "Kubernetes namespace where ArgoCD resources are created"
  value       = var.namespace
}
