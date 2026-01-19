#!/bin/bash
set -e

AWS_ACCOUNT_ID="180294183052"
AWS_REGION="ap-northeast-2"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "=== ECR Image Migration (using crane) ==="
echo "Registry: ${ECR_REGISTRY}"
echo ""

# Login to ECR with crane
echo "Authenticating to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | crane auth login ${ECR_REGISTRY} -u AWS --password-stdin

# Function to copy image
copy_image() {
  local repo_name=$1
  local source_image=$2
  local ecr_repo="hirehub/${repo_name}"
  local tag="${source_image##*:}"
  local ecr_image="${ECR_REGISTRY}/${ecr_repo}:${tag}"

  echo ""
  echo "=== ${repo_name}: ${source_image} → ${ecr_image} ==="

  # Create ECR repository if not exists
  aws ecr create-repository --repository-name "${ecr_repo}" --region ${AWS_REGION} 2>/dev/null || true

  # Copy image using crane
  echo "Copying..."
  crane copy "${source_image}" "${ecr_image}" --allow-nondistributable-artifacts

  echo "✓ Done: ${ecr_image}"
}

# Copy all images
copy_image "postgres" "postgres:15"
copy_image "kong" "kong:3.6"
copy_image "kong-ingress-controller" "kong/kubernetes-ingress-controller:3.1"
copy_image "clickhouse" "clickhouse/clickhouse-server:24.8"
copy_image "loki" "grafana/loki:3.3.2"
copy_image "k8s-sidecar" "kiwigrid/k8s-sidecar:1.28.0"
copy_image "memcached" "memcached:1.6.33-alpine"
copy_image "memcached-exporter" "prom/memcached-exporter:v0.15.0"
copy_image "nginx-unprivileged" "nginxinc/nginx-unprivileged:1.27-alpine"

echo ""
echo "=== All images migrated to ECR ==="
