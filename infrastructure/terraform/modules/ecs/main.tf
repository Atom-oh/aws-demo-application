# ECS Module for HireHub DR (Hot Standby)

locals {
  cluster_name = "${var.environment}-${var.project_name}-ecs"
  common_tags = merge(var.tags, {
    Module = "ecs"
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = local.cluster_name

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  configuration {
    execute_command_configuration {
      kms_key_id = var.kms_key_arn
      logging    = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/aws/ecs/${local.cluster_name}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = var.enable_fargate ? ["FARGATE", "FARGATE_SPOT"] : []

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = var.enable_fargate ? "FARGATE" : null
  }
}

# Task Execution Role
resource "aws_iam_role" "task_execution" {
  name = "${local.cluster_name}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "${local.cluster_name}-secrets-policy"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# Task Role
resource "aws_iam_role" "task" {
  name = "${local.cluster_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${local.cluster_name}-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow inbound from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = var.alb_security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-tasks-sg"
  })
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  count = var.enable_service_discovery ? 1 : 0

  name        = "${var.environment}.${var.project_name}.local"
  description = "Service discovery namespace for ${local.cluster_name}"
  vpc         = var.vpc_id

  tags = local.common_tags
}
