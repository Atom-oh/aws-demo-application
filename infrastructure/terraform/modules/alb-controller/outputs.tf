# AWS Load Balancer Controller Module Outputs

output "role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.alb_controller.arn
}

output "role_name" {
  description = "IAM role name for AWS Load Balancer Controller"
  value       = aws_iam_role.alb_controller.name
}

output "policy_arn" {
  description = "IAM policy ARN for AWS Load Balancer Controller"
  value       = aws_iam_policy.alb_controller.arn
}
