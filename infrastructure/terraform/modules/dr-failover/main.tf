# DR Failover Module
# Implements automatic DR failover from EKS to ECS using Lambda and Route53

locals {
  function_name = "${var.project_name}-dr-failover"
}

# IAM Role for Lambda
resource "aws_iam_role" "failover_lambda" {
  name = "${local.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "failover_lambda" {
  name = "${local.function_name}-policy"
  role = aws_iam_role.failover_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:ModifyRule",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:DescribeTargetGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "failover" {
  filename         = data.archive_file.failover_lambda.output_path
  function_name    = local.function_name
  role             = aws_iam_role.failover_lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.failover_lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      ALB_LISTENER_RULE_ARN = var.alb_listener_rule_arn
      EKS_TARGET_GROUP_ARN  = var.eks_target_group_arn
      ECS_TARGET_GROUP_ARN  = var.ecs_target_group_arn
      ECS_CLUSTER_NAME      = var.ecs_cluster_name
      ECS_SERVICE_NAME      = var.ecs_service_name
    }
  }

  tags = var.tags
}

# Package Lambda code
data "archive_file" "failover_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "failover_lambda" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14

  tags = var.tags
}

# Route53 Health Check (optional - for automatic failover)
resource "aws_route53_health_check" "eks" {
  count = var.enable_automatic_failover ? 1 : 0

  fqdn              = var.eks_health_check_fqdn
  port              = 443
  type              = "HTTPS"
  resource_path     = var.eks_health_check_path
  failure_threshold = 3
  request_interval  = 10

  tags = merge(var.tags, {
    Name = "${var.project_name}-eks-health-check"
  })
}

# CloudWatch Alarm for automatic failover
resource "aws_cloudwatch_metric_alarm" "eks_unhealthy" {
  count = var.enable_automatic_failover ? 1 : 0

  alarm_name          = "${var.project_name}-eks-unhealthy"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "EKS health check failed - trigger DR failover"

  dimensions = {
    HealthCheckId = aws_route53_health_check.eks[0].id
  }

  alarm_actions = [aws_sns_topic.dr_alerts[0].arn]
  ok_actions    = [aws_sns_topic.dr_alerts[0].arn]

  tags = var.tags
}

# SNS Topic for DR alerts
resource "aws_sns_topic" "dr_alerts" {
  count = var.enable_automatic_failover ? 1 : 0

  name = "${var.project_name}-dr-alerts"

  tags = var.tags
}

# SNS subscription to trigger Lambda
resource "aws_sns_topic_subscription" "failover_lambda" {
  count = var.enable_automatic_failover ? 1 : 0

  topic_arn = aws_sns_topic.dr_alerts[0].arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.failover.arn
}

# Lambda permission for SNS
resource "aws_lambda_permission" "sns" {
  count = var.enable_automatic_failover ? 1 : 0

  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.dr_alerts[0].arn
}
