#!/bin/bash
set -e

ECR_REPO="180294183052.dkr.ecr.ap-northeast-2.amazonaws.com/hirehub"
cd /home/ec2-user/demo

echo "=== Building resume-service ==="
docker build -t ${ECR_REPO}/resume-service:latest -f services/resume-service/Dockerfile .
docker push ${ECR_REPO}/resume-service:latest

echo "=== Building ai-service ==="
docker build -t ${ECR_REPO}/ai-service:latest -f services/ai-service/Dockerfile .
docker push ${ECR_REPO}/ai-service:latest

echo "=== Building match-service ==="
docker build -t ${ECR_REPO}/match-service:latest -f services/match-service/Dockerfile .
docker push ${ECR_REPO}/match-service:latest

echo "=== Building apply-service ==="
docker build -t ${ECR_REPO}/apply-service:latest -f services/apply-service/Dockerfile .
docker push ${ECR_REPO}/apply-service:latest

echo "=== Building notification-service ==="
docker build -t ${ECR_REPO}/notification-service:latest -f services/notification-service/Dockerfile .
docker push ${ECR_REPO}/notification-service:latest

echo "=== Building job-service ==="
docker build -t ${ECR_REPO}/job-service:latest -f services/job-service/Dockerfile .
docker push ${ECR_REPO}/job-service:latest

echo "=== All services built and pushed! ==="
