# ECS Module Outputs

output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "task_execution_role_arn" {
  description = "Task execution role ARN"
  value       = aws_iam_role.task_execution.arn
}

output "task_role_arn" {
  description = "Task role ARN"
  value       = aws_iam_role.task.arn
}

output "tasks_security_group_id" {
  description = "ECS tasks security group ID"
  value       = aws_security_group.ecs_tasks.id
}

output "service_discovery_namespace_id" {
  description = "Service discovery namespace ID"
  value       = var.enable_service_discovery ? aws_service_discovery_private_dns_namespace.main[0].id : null
}

output "service_discovery_namespace_arn" {
  description = "Service discovery namespace ARN"
  value       = var.enable_service_discovery ? aws_service_discovery_private_dns_namespace.main[0].arn : null
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.ecs.name
}
