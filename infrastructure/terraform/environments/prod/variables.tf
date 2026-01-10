# Production Environment Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

# VPC
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.1.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

# EKS
variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.29"
}

variable "eks_node_instance_types" {
  description = "EKS node instance types"
  type        = list(string)
  default     = ["m5.xlarge", "m5.2xlarge"]
}

variable "eks_node_desired_size" {
  description = "EKS node desired size"
  type        = number
  default     = 5
}

variable "eks_node_min_size" {
  description = "EKS node minimum size"
  type        = number
  default     = 3
}

variable "eks_node_max_size" {
  description = "EKS node maximum size"
  type        = number
  default     = 20
}

# Aurora
variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "aurora_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

# OpenSearch
variable "opensearch_engine_version" {
  description = "OpenSearch engine version"
  type        = string
  default     = "OpenSearch_2.11"
}

variable "opensearch_instance_type" {
  description = "OpenSearch instance type"
  type        = string
  default     = "r6g.large.search"
}

variable "opensearch_master_password" {
  description = "OpenSearch master password"
  type        = string
  sensitive   = true
}

# Redis
variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

# MSK
variable "kafka_version" {
  description = "Kafka version"
  type        = string
  default     = "3.5.1"
}

variable "msk_broker_instance_type" {
  description = "MSK broker instance type"
  type        = string
  default     = "kafka.m5.large"
}

# Cognito
variable "cognito_callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
}

variable "cognito_logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = null
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  default     = null
  sensitive   = true
}

variable "kakao_client_id" {
  description = "Kakao OAuth client ID"
  type        = string
  default     = null
}

variable "kakao_client_secret" {
  description = "Kakao OAuth client secret"
  type        = string
  default     = null
  sensitive   = true
}

variable "naver_client_id" {
  description = "Naver OAuth client ID"
  type        = string
  default     = null
}

variable "naver_client_secret" {
  description = "Naver OAuth client secret"
  type        = string
  default     = null
  sensitive   = true
}

# Kong / API Gateway
variable "rate_limit_per_minute" {
  description = "API rate limit per minute"
  type        = number
  default     = 1000
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
