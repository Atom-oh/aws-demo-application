#!/bin/bash
set -e

AWS_ACCOUNT_ID="180294183052"
AWS_REGION="ap-northeast-2"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Images to migrate
declare -A IMAGES=(
  ["postgres"]="postgres:15"
  ["kong"]="kong:3.6"
  ["kong-ingress-controller"]="kong/kubernetes-ingress-controller:3.1"
  ["clickhouse"]="clickhouse/clickhouse-server:24.8"
  ["loki"]="grafana/loki:3.3.2"
  ["k8s-sidecar"]="kiwigrid/k8s-sidecar:1.28.0"
  ["memcached"]="memcached:1.6.33-alpine"
  ["memcached-exporter"]="prom/memcached-exporter:v0.15.0"
  ["nginx-unprivileged"]="nginxinc/nginx-unprivileged:1.27-alpine"
)

echo "=== ECR Image Migration Script ==="
echo "Registry: ${ECR_REGISTRY}"
echo ""

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Create repositories and push images
for repo in "${!IMAGES[@]}"; do
  source_image="${IMAGES[$repo]}"
  ecr_repo="hirehub/${repo}"

  # Extract tag from source image
  tag="${source_image##*:}"
  ecr_image="${ECR_REGISTRY}/${ecr_repo}:${tag}"

  echo ""
  echo "=== Processing: ${source_image} ==="

  # Create ECR repository if not exists
  echo "Creating ECR repository: ${ecr_repo}"
  aws ecr create-repository --repository-name "${ecr_repo}" --region ${AWS_REGION} 2>/dev/null || echo "Repository exists"

  # Pull from Docker Hub
  echo "Pulling: ${source_image}"
  docker pull "${source_image}"

  # Tag for ECR
  echo "Tagging: ${ecr_image}"
  docker tag "${source_image}" "${ecr_image}"

  # Push to ECR
  echo "Pushing: ${ecr_image}"
  docker push "${ecr_image}"

  echo "✓ Completed: ${repo}"
done

echo ""
echo "=== Migration Complete ==="
echo ""
echo "ECR Images:"
for repo in "${!IMAGES[@]}"; do
  source_image="${IMAGES[$repo]}"
  tag="${source_image##*:}"
  echo "  ${ECR_REGISTRY}/hirehub/${repo}:${tag}"
done
