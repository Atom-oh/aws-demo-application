# OpenSearch Module for HireHub

locals {
  domain_name = "${var.environment}-${var.project_name}-search"
  common_tags = merge(var.tags, {
    Module = "opensearch"
  })
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Security Group
resource "aws_security_group" "opensearch" {
  name        = "${local.domain_name}-sg"
  description = "Security group for OpenSearch"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTPS from allowed security groups"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  ingress {
    description = "HTTPS from allowed CIDRs"
    from_port   = 443
    to_port     = 443
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
    Name = "${local.domain_name}-sg"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "opensearch" {
  count = var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for OpenSearch domain ${local.domain_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.domain_name}-kms"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "opensearch" {
  name              = "/aws/opensearch/${local.domain_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_resource_policy" "opensearch" {
  policy_name = "${local.domain_name}-logs-policy"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "es.amazonaws.com"
      }
      Action = [
        "logs:PutLogEvents",
        "logs:PutLogEventsBatch",
        "logs:CreateLogStream"
      ]
      Resource = "arn:aws:logs:*"
    }]
  })
}

# Service-Linked Role (if not exists)
resource "aws_iam_service_linked_role" "opensearch" {
  count            = var.create_service_linked_role ? 1 : 0
  aws_service_name = "opensearchservice.amazonaws.com"
}

# OpenSearch Domain
resource "aws_opensearch_domain" "main" {
  domain_name    = local.domain_name
  engine_version = var.engine_version

  cluster_config {
    instance_type            = var.instance_type
    instance_count           = var.instance_count
    dedicated_master_enabled = var.dedicated_master_enabled
    dedicated_master_type    = var.dedicated_master_enabled ? var.dedicated_master_type : null
    dedicated_master_count   = var.dedicated_master_enabled ? var.dedicated_master_count : null
    zone_awareness_enabled   = var.zone_awareness_enabled

    dynamic "zone_awareness_config" {
      for_each = var.zone_awareness_enabled ? [1] : []
      content {
        availability_zone_count = var.availability_zone_count
      }
    }

    warm_enabled = var.warm_enabled
    warm_type    = var.warm_enabled ? var.warm_type : null
    warm_count   = var.warm_enabled ? var.warm_count : null
  }

  vpc_options {
    subnet_ids         = slice(var.subnet_ids, 0, var.zone_awareness_enabled ? var.availability_zone_count : 1)
    security_group_ids = [aws_security_group.opensearch.id]
  }

  ebs_options {
    ebs_enabled = true
    volume_type = var.ebs_volume_type
    volume_size = var.ebs_volume_size
    iops        = var.ebs_volume_type == "gp3" ? var.ebs_iops : null
    throughput  = var.ebs_volume_type == "gp3" ? var.ebs_throughput : null
  }

  encrypt_at_rest {
    enabled    = true
    kms_key_id = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.opensearch[0].arn
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_security_options {
    enabled                        = var.fine_grained_access_enabled
    internal_user_database_enabled = var.internal_user_database_enabled

    dynamic "master_user_options" {
      for_each = var.fine_grained_access_enabled ? [1] : []
      content {
        master_user_name     = var.master_user_name
        master_user_password = var.master_user_password
      }
    }
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "INDEX_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "SEARCH_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "ES_APPLICATION_LOGS"
  }

  tags = merge(local.common_tags, {
    Name = local.domain_name
  })

  depends_on = [aws_iam_service_linked_role.opensearch, aws_cloudwatch_log_resource_policy.opensearch]
}

# Access Policy
resource "aws_opensearch_domain_policy" "main" {
  domain_name = aws_opensearch_domain.main.domain_name

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = "*"
      }
      Action   = "es:*"
      Resource = "${aws_opensearch_domain.main.arn}/*"
    }]
  })
}
