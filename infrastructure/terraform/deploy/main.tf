# HireHub Demo Deployment
# Simplified deployment for testing

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "hirehub-terraform-state"
    key            = "demo/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "hirehub-terraform-locks"
  }
}

provider "aws" {
  region = "ap-northeast-2"

  default_tags {
    tags = {
      Project     = "hirehub"
      Environment = "demo"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project_name = "hirehub"
  environment  = "demo"
}

# VPC Module
module "vpc" {
  source = "../modules/vpc"

  project_name         = local.project_name
  environment          = local.environment
  region               = "ap-northeast-2"
  vpc_cidr             = "10.100.0.0/16"
  az_count             = 2
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_flow_logs     = false
  enable_vpc_endpoints = true

  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

# DynamoDB Tables for HireHub
module "dynamodb_sessions" {
  source = "../modules/dynamodb"

  project_name = local.project_name
  environment  = local.environment
  table_name   = "sessions"
  hash_key     = "session_id"

  attributes = [
    { name = "session_id", type = "S" },
    { name = "user_id", type = "S" }
  ]

  global_secondary_indexes = [{
    name            = "user_id_index"
    hash_key        = "user_id"
    projection_type = "ALL"
  }]

  ttl_attribute_name = "expires_at"
  billing_mode       = "PAY_PER_REQUEST"
  enable_alarms      = false

  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

module "dynamodb_events" {
  source = "../modules/dynamodb"

  project_name = local.project_name
  environment  = local.environment
  table_name   = "events"
  hash_key     = "event_id"
  range_key    = "timestamp"

  attributes = [
    { name = "event_id", type = "S" },
    { name = "timestamp", type = "S" },
    { name = "entity_id", type = "S" }
  ]

  global_secondary_indexes = [{
    name            = "entity_index"
    hash_key        = "entity_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }]

  stream_enabled    = true
  stream_view_type  = "NEW_AND_OLD_IMAGES"
  billing_mode      = "PAY_PER_REQUEST"
  enable_alarms     = false

  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

# EKS Cluster
module "eks" {
  source = "../modules/eks"

  project_name           = local.project_name
  environment            = local.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  cluster_version        = "1.29"
  endpoint_public_access = true  # Demo 환경이므로 public access 허용

  node_instance_types    = ["t3.medium"]
  capacity_type          = "SPOT"
  node_desired_size      = 2
  node_min_size          = 1
  node_max_size          = 4

  enable_karpenter       = false  # Demo에서는 비활성화
  enable_keda            = false  # Demo에서는 비활성화

  enabled_cluster_log_types = ["api", "audit"]

  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR"
  value       = module.vpc.vpc_cidr
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "dynamodb_sessions_table" {
  description = "DynamoDB sessions table name"
  value       = module.dynamodb_sessions.table_name
}

output "dynamodb_events_table" {
  description = "DynamoDB events table name"
  value       = module.dynamodb_events.table_name
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_ca_data" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}
