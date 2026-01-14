variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "alb_listener_rule_arn" {
  description = "ARN of the ALB listener rule to modify"
  type        = string
}

variable "eks_target_group_arn" {
  description = "ARN of the EKS target group"
  type        = string
}

variable "ecs_target_group_arn" {
  description = "ARN of the ECS target group"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS service to scale"
  type        = string
}

variable "enable_automatic_failover" {
  description = "Enable automatic failover based on Route53 health checks"
  type        = bool
  default     = false
}

variable "eks_health_check_fqdn" {
  description = "FQDN for EKS health check"
  type        = string
  default     = ""
}

variable "eks_health_check_path" {
  description = "Path for EKS health check"
  type        = string
  default     = "/health"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
