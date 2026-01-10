# ElastiCache Module Variables

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

variable "subnet_group_name" {
  description = "ElastiCache subnet group name"
  type        = string
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "node_type" {
  description = "Node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (non-cluster mode)"
  type        = number
  default     = 2
}

variable "cluster_mode_enabled" {
  description = "Enable cluster mode"
  type        = bool
  default     = false
}

variable "num_node_groups" {
  description = "Number of node groups (cluster mode)"
  type        = number
  default     = 2
}

variable "replicas_per_node_group" {
  description = "Replicas per node group (cluster mode)"
  type        = number
  default     = 1
}

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Auth token (generated if null)"
  type        = string
  default     = null
  sensitive   = true
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
  default     = null
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Snapshot retention days"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Snapshot window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "auto_minor_version_upgrade" {
  description = "Enable auto minor version upgrade"
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

variable "allowed_security_group_ids" {
  description = "Allowed security groups"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks"
  type        = list(string)
  default     = []
}

variable "parameters" {
  description = "Redis parameters"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
