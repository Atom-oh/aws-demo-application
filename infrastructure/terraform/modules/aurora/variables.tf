# Aurora Module Variables

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

variable "db_subnet_group_name" {
  description = "DB subnet group name"
  type        = string
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "engine_mode" {
  description = "Engine mode (provisioned or serverless)"
  type        = string
  default     = "provisioned"
}

variable "database_name" {
  description = "Name of the default database"
  type        = string
  default     = "hirehub"
}

variable "master_username" {
  description = "Master username"
  type        = string
  default     = "hirehub_admin"
}

variable "master_password" {
  description = "Master password (generated if null)"
  type        = string
  default     = null
  sensitive   = true
}

variable "instance_class" {
  description = "Instance class for provisioned mode"
  type        = string
  default     = "db.r6g.large"
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 2
}

variable "enable_serverless_v2" {
  description = "Enable Serverless v2"
  type        = bool
  default     = false
}

variable "serverless_min_capacity" {
  description = "Serverless v2 min ACU"
  type        = number
  default     = 0.5
}

variable "serverless_max_capacity" {
  description = "Serverless v2 max ACU"
  type        = number
  default     = 16
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = false
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = null
}

variable "allowed_security_group_ids" {
  description = "Security groups allowed to connect"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect"
  type        = list(string)
  default     = []
}

variable "enabled_cloudwatch_logs_exports" {
  description = "CloudWatch log types to export"
  type        = list(string)
  default     = ["postgresql"]
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights retention (days)"
  type        = number
  default     = 7
}

variable "enhanced_monitoring_interval" {
  description = "Enhanced monitoring interval (0 to disable)"
  type        = number
  default     = 60
}

variable "auto_minor_version_upgrade" {
  description = "Enable auto minor version upgrade"
  type        = bool
  default     = true
}

variable "cluster_parameters" {
  description = "Cluster parameter group parameters"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string)
  }))
  default = []
}

variable "instance_parameters" {
  description = "Instance parameter group parameters"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string)
  }))
  default = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
