# Production Environment Configuration
# HireHub Terraform Variables

project_name = "hirehub"
environment  = "prod"
region       = "ap-northeast-2"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
az_count = 3

# EKS Configuration
eks_cluster_version     = "1.29"
eks_node_instance_types = ["m5.xlarge", "m5.2xlarge"]
eks_node_desired_size   = 5
eks_node_min_size       = 3
eks_node_max_size       = 20

# Aurora Configuration
aurora_engine_version = "15.4"
aurora_instance_class = "db.r6g.xlarge"

# OpenSearch Configuration
opensearch_engine_version = "OpenSearch_2.11"
opensearch_instance_type  = "r6g.large.search"
# opensearch_master_password = "SET_VIA_SECRETS_MANAGER"

# Redis Configuration
redis_engine_version = "7.1"
redis_node_type      = "cache.r6g.large"

# MSK Configuration
kafka_version            = "3.5.1"
msk_broker_instance_type = "kafka.m5.large"

# Cognito Configuration
cognito_callback_urls = [
  "https://hirehub.example.com/callback",
  "https://admin.hirehub.example.com/callback"
]
cognito_logout_urls = [
  "https://hirehub.example.com/logout",
  "https://admin.hirehub.example.com/logout"
]

# Social Login (set via AWS Secrets Manager or environment variables)
# google_client_id     = "SET_VIA_SECRETS_MANAGER"
# google_client_secret = "SET_VIA_SECRETS_MANAGER"
# kakao_client_id      = "SET_VIA_SECRETS_MANAGER"
# kakao_client_secret  = "SET_VIA_SECRETS_MANAGER"
# naver_client_id      = "SET_VIA_SECRETS_MANAGER"
# naver_client_secret  = "SET_VIA_SECRETS_MANAGER"

# Kong / API Gateway
rate_limit_per_minute = 1000
cors_allowed_origins = [
  "https://hirehub.example.com",
  "https://admin.hirehub.example.com"
]
acm_certificate_arn = "arn:aws:acm:ap-northeast-2:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# Tags
tags = {
  Team        = "platform"
  CostCenter  = "production"
  Compliance  = "required"
}
