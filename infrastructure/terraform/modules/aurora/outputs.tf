# Aurora Module Outputs

output "cluster_id" {
  description = "Aurora cluster ID"
  value       = aws_rds_cluster.main.id
}

output "cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "Cluster port"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "master_username" {
  description = "Master username"
  value       = aws_rds_cluster.main.master_username
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.aurora.id
}

output "credentials_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "instance_endpoints" {
  description = "Instance endpoints"
  value       = aws_rds_cluster_instance.main[*].endpoint
}
