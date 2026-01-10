# EKS Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "endpoint_public_access" {
  description = "Enable public API endpoint"
  type        = bool
  default     = true
}

variable "enabled_cluster_log_types" {
  description = "List of cluster log types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption (creates new if null)"
  type        = string
  default     = null
}

variable "node_instance_types" {
  description = "Instance types for node group"
  type        = list(string)
  default     = ["m5.large", "m5.xlarge"]
}

variable "capacity_type" {
  description = "Capacity type (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "node_desired_size" {
  description = "Desired number of nodes"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of nodes"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of nodes"
  type        = number
  default     = 10
}

variable "enable_karpenter" {
  description = "Enable Karpenter for autoscaling"
  type        = bool
  default     = true
}

variable "enable_keda" {
  description = "Enable KEDA for event-driven autoscaling"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
