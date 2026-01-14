# AWS Load Balancer Controller Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace for ALB Controller"
  type        = string
  default     = "kube-system"
}

variable "service_account_name" {
  description = "Service account name for ALB Controller"
  type        = string
  default     = "aws-load-balancer-controller"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
