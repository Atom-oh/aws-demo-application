# HireHub Development Environment
# Terraform configuration for dev environment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {
    bucket         = "hirehub-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "hirehub-terraform-locks"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  region             = var.region
  vpc_cidr           = var.vpc_cidr
  az_count           = var.az_count
  enable_nat_gateway = true
  single_nat_gateway = true  # Cost optimization for dev
  enable_flow_logs   = true
  enable_vpc_endpoints = true

  tags = var.tags
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  cluster_version    = var.eks_cluster_version
  node_instance_types = var.eks_node_instance_types
  capacity_type      = "SPOT"  # Cost optimization for dev
  node_desired_size  = var.eks_node_desired_size
  node_min_size      = var.eks_node_min_size
  node_max_size      = var.eks_node_max_size
  enable_karpenter   = true
  enable_keda        = true

  tags = var.tags
}

# ECS Module (DR - minimal for dev)
module "ecs" {
  source = "../../modules/ecs"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  enable_container_insights = false  # Disabled for dev
  enable_fargate            = true
  enable_service_discovery  = true

  tags = var.tags
}

# Aurora PostgreSQL Module
module "aurora" {
  source = "../../modules/aurora"

  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  db_subnet_group_name = module.vpc.db_subnet_group_name
  engine_version       = var.aurora_engine_version
  instance_class       = var.aurora_instance_class
  instance_count       = 1  # Single instance for dev
  enable_serverless_v2 = true  # Use serverless for dev
  serverless_min_capacity = 0.5
  serverless_max_capacity = 4
  backup_retention_period = 1
  deletion_protection  = false
  skip_final_snapshot  = true

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# OpenSearch Module
module "opensearch" {
  source = "../../modules/opensearch"

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  engine_version          = var.opensearch_engine_version
  instance_type           = var.opensearch_instance_type
  instance_count          = 1  # Single node for dev
  zone_awareness_enabled  = false
  ebs_volume_size         = 20

  master_user_password = var.opensearch_master_password

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# ElastiCache Redis Module
module "elasticache" {
  source = "../../modules/elasticache"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_group_name = module.vpc.elasticache_subnet_group_name
  engine_version    = var.redis_engine_version
  node_type         = var.redis_node_type
  num_cache_clusters = 1  # Single node for dev
  automatic_failover_enabled = false
  multi_az_enabled   = false

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# MSK Module
module "msk" {
  source = "../../modules/msk"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = slice(module.vpc.private_subnet_ids, 0, 2)
  kafka_version          = var.kafka_version
  number_of_broker_nodes = 2  # Minimum for dev
  broker_instance_type   = var.msk_broker_instance_type
  broker_ebs_volume_size = 50

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# Cognito Module
module "cognito" {
  source = "../../modules/cognito"

  project_name      = var.project_name
  environment       = var.environment
  mfa_configuration = "OPTIONAL"

  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls

  # Social login (optional for dev)
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  kakao_client_id      = var.kakao_client_id
  kakao_client_secret  = var.kakao_client_secret

  tags = var.tags
}

# S3 Module
module "s3" {
  source = "../../modules/s3"

  project_name   = var.project_name
  environment    = var.environment
  log_retention_days = 30

  cors_allowed_origins = ["*"]

  tags = var.tags
}

# Grafana Exposure Module (NLB + CloudFront)
# Security Group allows only CloudFront IPs
module "grafana_exposure" {
  source = "../../modules/grafana-exposure"
  count  = var.enable_grafana_external_access ? 1 : 0

  environment    = var.environment
  project_name   = var.project_name
  vpc_id         = module.vpc.vpc_id
  vpc_cidr       = var.vpc_cidr

  # NLB DNS - set after K8s creates the NLB
  nlb_dns_name      = var.grafana_nlb_dns_name
  nlb_https_enabled = false  # NLB uses HTTP to Grafana pod

  # CloudFront settings
  price_class = "PriceClass_200"  # Asia, Europe, North America

  # Custom domain (optional)
  grafana_domain      = var.grafana_domain
  hosted_zone_name    = var.hosted_zone_name
  acm_certificate_arn = var.grafana_acm_certificate_arn

  # Security
  origin_verify_secret = var.grafana_origin_verify_secret
  waf_acl_id           = var.grafana_waf_acl_id

  # Geo restriction (optional)
  geo_restriction_type      = "none"
  geo_restriction_locations = []

  tags = var.tags
}
