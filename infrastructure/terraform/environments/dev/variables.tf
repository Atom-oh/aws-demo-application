# Development Environment Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
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
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 2
}

# EKS
variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.34"
}

variable "eks_node_instance_types" {
  description = "EKS node instance types"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "eks_node_desired_size" {
  description = "EKS node desired size"
  type        = number
  default     = 2
}

variable "eks_node_min_size" {
  description = "EKS node minimum size"
  type        = number
  default     = 1
}

variable "eks_node_max_size" {
  description = "EKS node maximum size"
  type        = number
  default     = 5
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
  default     = "db.serverless"
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
  default     = "t3.small.search"
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
  default     = "cache.t3.micro"
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
  default     = "kafka.t3.small"
}

# Cognito
variable "cognito_callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "cognito_logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/logout"]
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

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# =============================================================================
# Grafana External Access (NLB + CloudFront)
# =============================================================================

variable "enable_grafana_external_access" {
  description = "Enable external access to Grafana via NLB + CloudFront"
  type        = bool
  default     = false
}

variable "grafana_nlb_dns_name" {
  description = "NLB DNS name for Grafana (set after K8s creates the NLB)"
  type        = string
  default     = "placeholder.elb.amazonaws.com"
}

variable "grafana_domain" {
  description = "Custom domain for Grafana (e.g., grafana.hirehub.example.com)"
  type        = string
  default     = ""
}

variable "hosted_zone_name" {
  description = "Route53 hosted zone name"
  type        = string
  default     = ""
}

variable "grafana_acm_certificate_arn" {
  description = "ACM certificate ARN for Grafana domain (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "grafana_origin_verify_secret" {
  description = "Secret header for CloudFront origin verification"
  type        = string
  default     = ""
  sensitive   = true
}

variable "grafana_waf_acl_id" {
  description = "WAF Web ACL ID for Grafana CloudFront"
  type        = string
  default     = null
}
