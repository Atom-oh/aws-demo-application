# HireHub Demo Deployment
# Simplified deployment for testing

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
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

# US East 1 provider for CloudFront ACM certificates
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

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
  cluster_version        = "1.34"
  endpoint_public_access = true  # Demo 환경이므로 public access 허용

  ami_type               = "AL2023_x86_64_STANDARD"  # AL2023 for EKS 1.33+
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

# =============================================================================
# AWS Load Balancer Controller - IAM & Pod Identity
# =============================================================================
# IAM resources (Role, Policy, Pod Identity Association) managed by Terraform
# Helm deployment managed by ArgoCD: argocd/applications/alb-controller.yaml
module "alb_controller" {
  source = "../modules/alb-controller"

  project_name         = local.project_name
  environment          = local.environment
  cluster_name         = module.eks.cluster_name
  namespace            = "kube-system"
  service_account_name = "aws-load-balancer-controller"

  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

# =============================================================================
# EKS ArgoCD Capability (Managed ArgoCD)
# =============================================================================
module "eks_argocd" {
  source = "../modules/eks-argocd"

  project_name    = local.project_name
  environment     = local.environment
  cluster_name    = module.eks.cluster_name
  capability_name = "argocd"
  namespace       = "argocd"

  # AWS Identity Center (SSO) - Required for EKS ArgoCD Capability
  idc_instance_arn = "arn:aws:sso:::instance/ssoins-723043e00756671c"
  idc_region       = "ap-northeast-2"

  # RBAC Role Mappings for Identity Center users/groups
  rbac_role_mappings = [
    {
      role = "ADMIN"
      identities = [
        {
          id   = "9b6767ca5e-85bb93fc-5ebe-4c11-9379-c5696247ec59"  # Admins@amazon.com group
          type = "SSO_GROUP"
        },
        {
          id   = "9b6767ca5e-08632052-e55b-49c7-bffd-760f5f287fee"  # test1@AMAZON.COM user
          type = "SSO_USER"
        }
      ]
    }
  ]

  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

# =============================================================================
# Frontend S3 Bucket for Static Assets
# =============================================================================
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.project_name}-${local.environment}-frontend"

  tags = {
    Name        = "${local.project_name}-${local.environment}-frontend"
    Project     = local.project_name
    Environment = local.environment
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudFront OAC
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloudfront.frontend_distribution_arn
          }
        }
      }
    ]
  })

  depends_on = [module.cloudfront]
}

# =============================================================================
# CloudFront for Kong API Gateway and Frontend
# =============================================================================
module "cloudfront" {
  source = "../modules/cloudfront"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project_name     = local.project_name
  environment      = local.environment
  domain_name      = "*.aws.atomai.click"
  hosted_zone_name = "aws.atomai.click"

  # Kong API Gateway Distribution (msa-demo-api.aws.atomai.click)
  create_kong_distribution = true
  kong_domain              = "msa-demo-api.aws.atomai.click"
  kong_origin_domain       = "k8s-kong-kongkong-60cc801a5a-234a19df93b2bffe.elb.ap-northeast-2.amazonaws.com"

  # Frontend Distribution (msa-demo.aws.atomai.click)
  create_frontend_distribution = true
  frontend_domain              = "msa-demo.aws.atomai.click"
  frontend_s3_bucket_domain    = aws_s3_bucket.frontend.bucket_regional_domain_name
  frontend_ssr_origin_domain   = "k8s-kong-kongkong-60cc801a5a-234a19df93b2bffe.elb.ap-northeast-2.amazonaws.com"

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

# ArgoCD Outputs
output "argocd_capability_arn" {
  description = "ArgoCD Capability ARN"
  value       = module.eks_argocd.capability_arn
}

output "argocd_server_url" {
  description = "ArgoCD Server URL (EKS Managed)"
  value       = module.eks_argocd.server_url
}

# ALB Controller Outputs
output "alb_controller_role_arn" {
  description = "ALB Controller IAM Role ARN"
  value       = module.alb_controller.role_arn
}

# CloudFront Outputs
output "kong_api_url" {
  description = "Kong API Gateway URL via CloudFront"
  value       = module.cloudfront.kong_url
}

output "kong_cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for Kong"
  value       = module.cloudfront.kong_distribution_id
}

# Frontend Outputs
output "frontend_url" {
  description = "Frontend URL via CloudFront"
  value       = module.cloudfront.frontend_url
}

output "frontend_s3_bucket" {
  description = "Frontend S3 bucket name for static assets"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for Frontend"
  value       = module.cloudfront.frontend_distribution_id
}
