# ElastiCache Module Outputs

output "replication_group_id" {
  description = "Replication group ID"
  value       = aws_elasticache_replication_group.main.id
}

output "replication_group_arn" {
  description = "Replication group ARN"
  value       = aws_elasticache_replication_group.main.arn
}

output "primary_endpoint_address" {
  description = "Primary endpoint address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Reader endpoint address"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "configuration_endpoint_address" {
  description = "Configuration endpoint (cluster mode)"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.configuration_endpoint_address : null
}

output "port" {
  description = "Redis port"
  value       = 6379
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.redis.id
}

output "auth_token_secret_arn" {
  description = "Auth token secret ARN"
  value       = var.transit_encryption_enabled ? aws_secretsmanager_secret.auth_token[0].arn : null
}
