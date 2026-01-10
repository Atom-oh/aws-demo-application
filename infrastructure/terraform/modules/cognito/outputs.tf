# Cognito Module Outputs

output "user_pool_id" {
  description = "User pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "User pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "User pool endpoint"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_domain" {
  description = "User pool domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "client_id" {
  description = "App client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "client_secret" {
  description = "App client secret"
  value       = aws_cognito_user_pool_client.main.client_secret
  sensitive   = true
}

output "identity_pool_id" {
  description = "Identity pool ID"
  value       = var.create_identity_pool ? aws_cognito_identity_pool.main[0].id : null
}

output "authenticated_role_arn" {
  description = "Authenticated role ARN"
  value       = var.create_identity_pool ? aws_iam_role.authenticated[0].arn : null
}

output "unauthenticated_role_arn" {
  description = "Unauthenticated role ARN"
  value       = var.create_identity_pool && var.allow_unauthenticated_identities ? aws_iam_role.unauthenticated[0].arn : null
}

output "hosted_ui_url" {
  description = "Hosted UI URL"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

data "aws_region" "current" {}
