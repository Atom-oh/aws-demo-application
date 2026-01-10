# OpenSearch Module Variables

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

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "engine_version" {
  description = "OpenSearch engine version"
  type        = string
  default     = "OpenSearch_2.11"
}

variable "instance_type" {
  description = "Instance type"
  type        = string
  default     = "r6g.large.search"
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 2
}

variable "dedicated_master_enabled" {
  description = "Enable dedicated master nodes"
  type        = bool
  default     = false
}

variable "dedicated_master_type" {
  description = "Dedicated master instance type"
  type        = string
  default     = "r6g.large.search"
}

variable "dedicated_master_count" {
  description = "Number of dedicated master nodes"
  type        = number
  default     = 3
}

variable "zone_awareness_enabled" {
  description = "Enable zone awareness"
  type        = bool
  default     = true
}

variable "availability_zone_count" {
  description = "Number of AZs"
  type        = number
  default     = 2
}

variable "warm_enabled" {
  description = "Enable warm storage"
  type        = bool
  default     = false
}

variable "warm_type" {
  description = "Warm node instance type"
  type        = string
  default     = "ultrawarm1.medium.search"
}

variable "warm_count" {
  description = "Number of warm nodes"
  type        = number
  default     = 2
}

variable "ebs_volume_type" {
  description = "EBS volume type"
  type        = string
  default     = "gp3"
}

variable "ebs_volume_size" {
  description = "EBS volume size in GB"
  type        = number
  default     = 100
}

variable "ebs_iops" {
  description = "EBS IOPS (for gp3)"
  type        = number
  default     = 3000
}

variable "ebs_throughput" {
  description = "EBS throughput (for gp3)"
  type        = number
  default     = 125
}

variable "fine_grained_access_enabled" {
  description = "Enable fine-grained access control"
  type        = bool
  default     = true
}

variable "internal_user_database_enabled" {
  description = "Enable internal user database"
  type        = bool
  default     = true
}

variable "master_user_name" {
  description = "Master user name"
  type        = string
  default     = "admin"
}

variable "master_user_password" {
  description = "Master user password"
  type        = string
  sensitive   = true
}

variable "kms_key_arn" {
  description = "KMS key ARN"
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

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "create_service_linked_role" {
  description = "Create service-linked role"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
