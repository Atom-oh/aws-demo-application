# ECS Module Variables

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

variable "enable_container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = true
}

variable "enable_fargate" {
  description = "Enable Fargate capacity provider"
  type        = bool
  default     = true
}

variable "enable_service_discovery" {
  description = "Enable AWS Cloud Map service discovery"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = null
}

variable "alb_security_group_ids" {
  description = "ALB security group IDs"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
