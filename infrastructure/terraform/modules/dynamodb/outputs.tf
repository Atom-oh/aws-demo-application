# DynamoDB Module Outputs

output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.main.arn
}

output "table_id" {
  description = "DynamoDB table ID"
  value       = aws_dynamodb_table.main.id
}

output "stream_arn" {
  description = "DynamoDB stream ARN"
  value       = aws_dynamodb_table.main.stream_arn
}

output "stream_label" {
  description = "DynamoDB stream label"
  value       = aws_dynamodb_table.main.stream_label
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.kms_key_arn != null ? var.kms_key_arn : (length(aws_kms_key.dynamodb) > 0 ? aws_kms_key.dynamodb[0].arn : null)
}
