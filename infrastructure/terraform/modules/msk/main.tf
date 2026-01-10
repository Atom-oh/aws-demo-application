# MSK (Kafka) Module for HireHub

locals {
  cluster_name = "${var.environment}-${var.project_name}-msk"
  common_tags = merge(var.tags, {
    Module = "msk"
  })
}

data "aws_region" "current" {}

# Security Group
resource "aws_security_group" "msk" {
  name        = "${local.cluster_name}-sg"
  description = "Security group for MSK"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Kafka from allowed security groups"
    from_port       = 9092
    to_port         = 9098
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  ingress {
    description     = "Zookeeper from allowed security groups"
    from_port       = 2181
    to_port         = 2181
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
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
resource "aws_kms_key" "msk" {
  count = var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for MSK cluster ${local.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-kms"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "msk" {
  name              = "/aws/msk/${local.cluster_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# S3 Bucket for logs (optional)
resource "aws_s3_bucket" "msk_logs" {
  count  = var.s3_logs_enabled ? 1 : 0
  bucket = "${local.cluster_name}-logs-${data.aws_region.current.name}"

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-logs"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "msk_logs" {
  count  = var.s3_logs_enabled ? 1 : 0
  bucket = aws_s3_bucket.msk_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# MSK Configuration
resource "aws_msk_configuration" "main" {
  name              = "${local.cluster_name}-config"
  kafka_versions    = [var.kafka_version]
  server_properties = var.server_properties

  lifecycle {
    create_before_destroy = true
  }
}

# MSK Cluster
resource "aws_msk_cluster" "main" {
  cluster_name           = local.cluster_name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.number_of_broker_nodes

  broker_node_group_info {
    instance_type   = var.broker_instance_type
    client_subnets  = var.subnet_ids
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = var.broker_ebs_volume_size
        provisioned_throughput {
          enabled           = var.provisioned_throughput_enabled
          volume_throughput = var.provisioned_throughput_enabled ? var.volume_throughput : null
        }
      }
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.msk[0].arn

    encryption_in_transit {
      client_broker = var.encryption_in_transit_client_broker
      in_cluster    = var.encryption_in_transit_in_cluster
    }
  }

  client_authentication {
    sasl {
      iam   = var.sasl_iam_enabled
      scram = var.sasl_scram_enabled
    }

    unauthenticated = var.unauthenticated_access_enabled
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = var.cloudwatch_logs_enabled
        log_group = aws_cloudwatch_log_group.msk.name
      }

      s3 {
        enabled = var.s3_logs_enabled
        bucket  = var.s3_logs_enabled ? aws_s3_bucket.msk_logs[0].id : null
        prefix  = var.s3_logs_enabled ? "logs/msk-" : null
      }
    }
  }

  open_monitoring {
    prometheus {
      jmx_exporter {
        enabled_in_broker = var.prometheus_jmx_exporter_enabled
      }
      node_exporter {
        enabled_in_broker = var.prometheus_node_exporter_enabled
      }
    }
  }

  enhanced_monitoring = var.enhanced_monitoring

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })
}

# SCRAM Secret Association (if SCRAM is enabled)
resource "aws_secretsmanager_secret" "msk_scram" {
  count = var.sasl_scram_enabled ? 1 : 0

  name       = "AmazonMSK_${local.cluster_name}_credentials"
  kms_key_id = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.msk[0].arn

  tags = local.common_tags
}

resource "aws_msk_scram_secret_association" "main" {
  count = var.sasl_scram_enabled ? 1 : 0

  cluster_arn     = aws_msk_cluster.main.arn
  secret_arn_list = [aws_secretsmanager_secret.msk_scram[0].arn]

  depends_on = [aws_secretsmanager_secret.msk_scram]
}
