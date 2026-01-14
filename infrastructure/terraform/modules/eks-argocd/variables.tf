# EKS ArgoCD Capability Module Variables

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

variable "capability_name" {
  description = "Name for the ArgoCD capability (must be unique within the cluster)"
  type        = string
  default     = "argocd"
}

variable "namespace" {
  description = "Kubernetes namespace for ArgoCD resources"
  type        = string
  default     = "argocd"
}

variable "idc_instance_arn" {
  description = "ARN of the AWS IAM Identity Center instance for SSO authentication (Required)"
  type        = string
}

variable "idc_region" {
  description = "Region of the AWS IAM Identity Center instance (defaults to current region)"
  type        = string
  default     = null
}

variable "vpce_ids" {
  description = "List of VPC Endpoint IDs for private network access to ArgoCD server"
  type        = list(string)
  default     = []
}

variable "rbac_role_mappings" {
  description = "RBAC role mappings for Identity Center users/groups"
  type = list(object({
    role = string # ADMIN, EDITOR, or VIEWER
    identities = list(object({
      id   = string
      type = string # SSO_USER or SSO_GROUP
    }))
  }))
  default = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
