# Development Environment Configuration
# HireHub Terraform Variables

project_name = "hirehub"
environment  = "dev"
region       = "ap-northeast-2"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
az_count = 2

# EKS Configuration
eks_cluster_version     = "1.29"
eks_node_instance_types = ["t3.medium", "t3.large"]
eks_node_desired_size   = 2
eks_node_min_size       = 1
eks_node_max_size       = 5

# Aurora Configuration
aurora_engine_version = "15.4"
aurora_instance_class = "db.serverless"

# OpenSearch Configuration
opensearch_engine_version = "OpenSearch_2.11"
opensearch_instance_type  = "t3.small.search"
# opensearch_master_password = "SET_VIA_ENV_VAR"  # Use TF_VAR_opensearch_master_password

# Redis Configuration
redis_engine_version = "7.1"
redis_node_type      = "cache.t3.micro"

# MSK Configuration
kafka_version            = "3.5.1"
msk_broker_instance_type = "kafka.t3.small"

# Cognito Configuration
cognito_callback_urls = [
  "http://localhost:3000/callback",
  "http://localhost:3001/callback"
]
cognito_logout_urls = [
  "http://localhost:3000/logout",
  "http://localhost:3001/logout"
]

# Social Login (set via environment variables)
# google_client_id     = "SET_VIA_ENV_VAR"
# google_client_secret = "SET_VIA_ENV_VAR"
# kakao_client_id      = "SET_VIA_ENV_VAR"
# kakao_client_secret  = "SET_VIA_ENV_VAR"

# Tags
tags = {
  Team        = "platform"
  CostCenter  = "development"
}
