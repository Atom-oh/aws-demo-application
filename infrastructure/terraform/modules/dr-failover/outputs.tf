output "lambda_function_name" {
  description = "Name of the DR failover Lambda function"
  value       = aws_lambda_function.failover.function_name
}

output "lambda_function_arn" {
  description = "ARN of the DR failover Lambda function"
  value       = aws_lambda_function.failover.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.failover_lambda.arn
}

output "health_check_id" {
  description = "ID of the Route53 health check (if enabled)"
  value       = var.enable_automatic_failover ? aws_route53_health_check.eks[0].id : null
}

output "sns_topic_arn" {
  description = "ARN of the DR alerts SNS topic (if enabled)"
  value       = var.enable_automatic_failover ? aws_sns_topic.dr_alerts[0].arn : null
}
