# EKS ArgoCD Capability Module
# Manages ArgoCD as a native EKS Capability (fully managed by AWS)

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

locals {
  name = "${var.environment}-${var.project_name}-argocd"
  common_tags = merge(var.tags, {
    Module = "eks-argocd"
  })
}

# IAM Role for EKS ArgoCD Capability
resource "aws_iam_role" "argocd_capability" {
  name = "${local.name}-capability-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "capabilities.eks.amazonaws.com"
        }
        Action = [
          "sts:AssumeRole",
          "sts:TagSession"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for ArgoCD Capability - Access to EKS cluster
resource "aws_iam_role_policy" "argocd_capability" {
  name = "${local.name}-capability-policy"
  role = aws_iam_role.argocd_capability.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/*"
      }
    ]
  })
}

# EKS ArgoCD Capability
resource "aws_eks_capability" "argocd" {
  cluster_name              = var.cluster_name
  capability_name           = var.capability_name
  type                      = "ARGOCD"
  role_arn                  = aws_iam_role.argocd_capability.arn
  delete_propagation_policy = "RETAIN"

  configuration {
    argo_cd {
      namespace = var.namespace

      # AWS Identity Center (SSO) integration - Required
      aws_idc {
        idc_instance_arn = var.idc_instance_arn
        idc_region       = var.idc_region != null ? var.idc_region : data.aws_region.current.name
      }

      # Private network access via VPC Endpoints
      dynamic "network_access" {
        for_each = length(var.vpce_ids) > 0 ? [1] : []
        content {
          vpce_ids = var.vpce_ids
        }
      }

      # RBAC role mappings for Identity Center users/groups
      dynamic "rbac_role_mapping" {
        for_each = var.rbac_role_mappings
        content {
          role = rbac_role_mapping.value.role

          dynamic "identity" {
            for_each = rbac_role_mapping.value.identities
            content {
              id   = identity.value.id
              type = identity.value.type
            }
          }
        }
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = local.name
  })
}
