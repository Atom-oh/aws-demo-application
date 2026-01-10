# HireHub Production Environment
# Terraform configuration for production environment

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
    key            = "prod/terraform.tfstate"
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

# Kubernetes provider configuration
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# VPC Module - Production grade with multi-AZ
module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  region             = var.region
  vpc_cidr           = var.vpc_cidr
  az_count           = var.az_count
  enable_nat_gateway = true
  single_nat_gateway = false  # HA: NAT per AZ
  enable_flow_logs   = true
  flow_log_retention_days = 90
  enable_vpc_endpoints = true

  tags = var.tags
}

# EKS Module - Production configuration
module "eks" {
  source = "../../modules/eks"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  cluster_version        = var.eks_cluster_version
  endpoint_public_access = false  # Private only in prod
  node_instance_types    = var.eks_node_instance_types
  capacity_type          = "ON_DEMAND"  # Stable for prod
  node_desired_size      = var.eks_node_desired_size
  node_min_size          = var.eks_node_min_size
  node_max_size          = var.eks_node_max_size
  enable_karpenter       = true
  enable_keda            = true

  tags = var.tags
}

# ECS Module - DR Hot Standby
module "ecs" {
  source = "../../modules/ecs"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  enable_container_insights = true
  enable_fargate            = true
  enable_service_discovery  = true

  tags = var.tags
}

# Aurora PostgreSQL Module - Production HA
module "aurora" {
  source = "../../modules/aurora"

  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  db_subnet_group_name = module.vpc.db_subnet_group_name
  engine_version       = var.aurora_engine_version
  instance_class       = var.aurora_instance_class
  instance_count       = 3  # Primary + 2 readers
  enable_serverless_v2 = false
  backup_retention_period = 35
  deletion_protection  = true
  skip_final_snapshot  = false
  performance_insights_enabled = true
  performance_insights_retention_period = 31
  enhanced_monitoring_interval = 30

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# OpenSearch Module - Production HA
module "opensearch" {
  source = "../../modules/opensearch"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  subnet_ids                = module.vpc.private_subnet_ids
  engine_version            = var.opensearch_engine_version
  instance_type             = var.opensearch_instance_type
  instance_count            = 3
  dedicated_master_enabled  = true
  dedicated_master_type     = "r6g.large.search"
  dedicated_master_count    = 3
  zone_awareness_enabled    = true
  availability_zone_count   = 3
  ebs_volume_size           = 500
  ebs_volume_type           = "gp3"
  ebs_iops                  = 3000

  master_user_password = var.opensearch_master_password

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# ElastiCache Redis Module - Production HA
module "elasticache" {
  source = "../../modules/elasticache"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  engine_version     = var.redis_engine_version
  node_type          = var.redis_node_type
  num_cache_clusters = 3  # Primary + 2 replicas
  automatic_failover_enabled = true
  multi_az_enabled   = true
  snapshot_retention_limit = 7

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# MSK Module - Production HA
module "msk" {
  source = "../../modules/msk"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.private_subnet_ids
  kafka_version          = var.kafka_version
  number_of_broker_nodes = 3
  broker_instance_type   = var.msk_broker_instance_type
  broker_ebs_volume_size = 500
  enhanced_monitoring    = "PER_TOPIC_PER_BROKER"

  allowed_security_group_ids = [
    module.eks.cluster_security_group_id,
    module.ecs.tasks_security_group_id
  ]

  tags = var.tags
}

# Cognito Module - Production
module "cognito" {
  source = "../../modules/cognito"

  project_name          = var.project_name
  environment           = var.environment
  mfa_configuration     = "OPTIONAL"
  advanced_security_mode = "ENFORCED"

  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls

  # Social login
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  kakao_client_id      = var.kakao_client_id
  kakao_client_secret  = var.kakao_client_secret
  naver_client_id      = var.naver_client_id
  naver_client_secret  = var.naver_client_secret

  tags = var.tags
}

# S3 Module - Production
module "s3" {
  source = "../../modules/s3"

  project_name       = var.project_name
  environment        = var.environment
  log_retention_days = 365

  cors_allowed_origins = var.cors_allowed_origins

  tags = var.tags
}

# Kong API Gateway Module
module "kong" {
  source = "../../modules/kong"

  project_name         = var.project_name
  environment          = var.environment
  replicas             = 3
  postgres_host        = module.aurora.cluster_endpoint
  postgres_secret_name = "kong-db-credentials"

  # Rate limiting using Redis
  enable_rate_limiting  = true
  rate_limit_per_minute = var.rate_limit_per_minute
  redis_host            = module.elasticache.primary_endpoint_address
  redis_port            = module.elasticache.port

  # Security features
  enable_circuit_breaker = true
  enable_cors            = true
  cors_origins           = var.cors_allowed_origins
  enable_jwt_auth        = true

  service_annotations = {
    "service.beta.kubernetes.io/aws-load-balancer-type"            = "nlb"
    "service.beta.kubernetes.io/aws-load-balancer-scheme"          = "internet-facing"
    "service.beta.kubernetes.io/aws-load-balancer-ssl-cert"        = var.acm_certificate_arn
    "service.beta.kubernetes.io/aws-load-balancer-ssl-ports"       = "443"
    "service.beta.kubernetes.io/aws-load-balancer-backend-protocol" = "tcp"
  }

  tags = var.tags
}
