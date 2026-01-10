# ElastiCache Redis Module for HireHub

locals {
  cluster_name = "${var.environment}-${var.project_name}-redis"
  common_tags = merge(var.tags, {
    Module = "elasticache"
  })
}

# Security Group
resource "aws_security_group" "redis" {
  name        = "${local.cluster_name}-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from allowed security groups"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  ingress {
    description = "Redis from allowed CIDRs"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-sg"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "redis" {
  count = var.kms_key_arn == null && var.at_rest_encryption_enabled ? 1 : 0

  description             = "KMS key for ElastiCache ${local.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-kms"
  })
}

# Auth Token in Secrets Manager
resource "random_password" "auth_token" {
  count   = var.transit_encryption_enabled && var.auth_token == null ? 1 : 0
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "auth_token" {
  count = var.transit_encryption_enabled ? 1 : 0

  name                    = "${var.environment}/${var.project_name}/redis/auth-token"
  description             = "ElastiCache Redis auth token"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "auth_token" {
  count = var.transit_encryption_enabled ? 1 : 0

  secret_id = aws_secretsmanager_secret.auth_token[0].id
  secret_string = jsonencode({
    auth_token = var.auth_token != null ? var.auth_token : random_password.auth_token[0].result
    endpoint   = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.configuration_endpoint_address : aws_elasticache_replication_group.main.primary_endpoint_address
    port       = 6379
  })
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  family      = "redis${split(".", var.engine_version)[0]}"
  name        = "${local.cluster_name}-params"
  description = "Parameter group for ${local.cluster_name}"

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = local.common_tags
}

# Replication Group
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = local.cluster_name
  description          = "Redis cluster for ${var.project_name}"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.main.name

  num_cache_clusters = var.cluster_mode_enabled ? null : var.num_cache_clusters

  dynamic "num_node_groups" {
    for_each = var.cluster_mode_enabled ? [1] : []
    content {
    }
  }

  num_node_groups         = var.cluster_mode_enabled ? var.num_node_groups : null
  replicas_per_node_group = var.cluster_mode_enabled ? var.replicas_per_node_group : null

  subnet_group_name  = var.subnet_group_name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  kms_key_id                 = var.at_rest_encryption_enabled ? (var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.redis[0].arn) : null

  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.transit_encryption_enabled ? (var.auth_token != null ? var.auth_token : random_password.auth_token[0].result) : null

  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window
  maintenance_window       = var.maintenance_window

  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  apply_immediately          = var.apply_immediately

  notification_topic_arn = var.notification_topic_arn

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })
}
