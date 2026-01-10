# S3 Module Outputs

output "resumes_bucket_id" {
  description = "Resumes bucket ID"
  value       = aws_s3_bucket.resumes.id
}

output "resumes_bucket_arn" {
  description = "Resumes bucket ARN"
  value       = aws_s3_bucket.resumes.arn
}

output "assets_bucket_id" {
  description = "Assets bucket ID"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  description = "Assets bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

output "assets_bucket_regional_domain_name" {
  description = "Assets bucket regional domain name"
  value       = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "logs_bucket_id" {
  description = "Logs bucket ID"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "Logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

output "ai_data_bucket_id" {
  description = "AI data bucket ID"
  value       = aws_s3_bucket.ai_data.id
}

output "ai_data_bucket_arn" {
  description = "AI data bucket ARN"
  value       = aws_s3_bucket.ai_data.arn
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.s3[0].arn
}
