# Aurora PostgreSQL Module for HireHub

locals {
  cluster_name = "${var.environment}-${var.project_name}-aurora"
  common_tags = merge(var.tags, {
    Module = "aurora"
  })
}

# Random password for master user
resource "random_password" "master" {
  count   = var.master_password == null ? 1 : 0
  length  = 32
  special = false
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.environment}/${var.project_name}/aurora/credentials"
  description             = "Aurora PostgreSQL credentials for ${local.cluster_name}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.master_username
    password = var.master_password != null ? var.master_password : random_password.master[0].result
    host     = aws_rds_cluster.main.endpoint
    port     = aws_rds_cluster.main.port
    dbname   = var.database_name
  })
}

# Security Group
resource "aws_security_group" "aurora" {
  name        = "${local.cluster_name}-sg"
  description = "Security group for Aurora PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from allowed security groups"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  ingress {
    description = "PostgreSQL from allowed CIDRs"
    from_port   = 5432
    to_port     = 5432
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
resource "aws_kms_key" "aurora" {
  count = var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for Aurora cluster ${local.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-kms"
  })
}

# Parameter Group
resource "aws_rds_cluster_parameter_group" "main" {
  family      = "aurora-postgresql${split(".", var.engine_version)[0]}"
  name        = "${local.cluster_name}-cluster-params"
  description = "Cluster parameter group for ${local.cluster_name}"

  dynamic "parameter" {
    for_each = var.cluster_parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", "immediate")
    }
  }

  tags = local.common_tags
}

resource "aws_db_parameter_group" "main" {
  family      = "aurora-postgresql${split(".", var.engine_version)[0]}"
  name        = "${local.cluster_name}-instance-params"
  description = "Instance parameter group for ${local.cluster_name}"

  dynamic "parameter" {
    for_each = var.instance_parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", "immediate")
    }
  }

  tags = local.common_tags
}

# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier = local.cluster_name
  engine             = "aurora-postgresql"
  engine_mode        = var.engine_mode
  engine_version     = var.engine_version
  database_name      = var.database_name

  master_username = var.master_username
  master_password = var.master_password != null ? var.master_password : random_password.master[0].result

  db_subnet_group_name            = var.db_subnet_group_name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  storage_encrypted = true
  kms_key_id        = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.aurora[0].arn

  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window

  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.cluster_name}-final-snapshot"

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  dynamic "serverlessv2_scaling_configuration" {
    for_each = var.engine_mode == "provisioned" && var.enable_serverless_v2 ? [1] : []
    content {
      min_capacity = var.serverless_min_capacity
      max_capacity = var.serverless_max_capacity
    }
  }

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })
}

# Aurora Instances
resource "aws_rds_cluster_instance" "main" {
  count = var.instance_count

  identifier         = "${local.cluster_name}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.enable_serverless_v2 ? "db.serverless" : var.instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  db_parameter_group_name = aws_db_parameter_group.main.name

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id       = var.performance_insights_enabled ? (var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.aurora[0].arn) : null

  monitoring_interval = var.enhanced_monitoring_interval
  monitoring_role_arn = var.enhanced_monitoring_interval > 0 ? aws_iam_role.monitoring[0].arn : null

  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  publicly_accessible        = false

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-${count.index + 1}"
  })
}

# Enhanced Monitoring IAM Role
resource "aws_iam_role" "monitoring" {
  count = var.enhanced_monitoring_interval > 0 ? 1 : 0

  name = "${local.cluster_name}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "monitoring" {
  count = var.enhanced_monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
