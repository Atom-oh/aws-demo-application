# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HireHub** - AWS 클라우드 네이티브 기술을 활용한 AI 기반 채용 플랫폼 데모

## Architecture

### Services (gRPC + mTLS)
| Service | Tech | Role |
|---------|------|------|
| user-service | Go | 회원 관리 |
| job-service | Java/Spring Boot | 채용공고 |
| resume-service | Python/FastAPI | 이력서, PII 제거 |
| apply-service | Go | 지원 관리 |
| match-service | Python/FastAPI | AI 매칭 |
| ai-service | Python/FastAPI | AgentCore, RAG, sLLM |
| notification-service | Go | Kafka 기반 알림 |

### Frontend
- `web-frontend`: Next.js (구직자/기업)
- `admin-dashboard`: Next.js (어드민)

### Infrastructure
- **Compute**: EKS (Primary, Karpenter, KEDA) + ECS (DR, Managed Instance, Hot Standby)
- **Data**: Aurora PostgreSQL, OpenSearch, ElastiCache, DynamoDB, S3
- **AI**: Bedrock (AgentCore), QWEN3 on vLLM (PII), Bedrock KB (RAG)
- **Messaging**: MSK (Kafka)
- **Auth**: Cognito + 소셜 로그인
- **API Gateway**: Kong (Rate Limiting, Circuit Breaker, Auth) - Internal NLB
- **GitOps**: ArgoCD (App of Apps pattern)
- **IAM**: Pod Identity (preferred over IRSA)
- **Security**: CloudFront + Prefix-list SG for external access

### Deployment Strategy
| Layer | Tool | Description |
|-------|------|-------------|
| AWS 리소스 (VPC, EKS, Aurora 등) | Terraform | `infrastructure/terraform/` |
| EKS Addons | Terraform | EKS Blueprint addons |
| K8s 워크로드 (Kong, Services) | ArgoCD | `infrastructure/argocd/` |

### ArgoCD Structure
```
infrastructure/argocd/
├── install/              # ArgoCD Helm values
├── projects/             # AppProject (hirehub)
├── applications/         # Application manifests
│   ├── root-app.yaml     # App of Apps root
│   ├── kong.yaml         # Kong API Gateway
│   ├── kong-plugins.yaml # Kong plugins
│   └── hirehub.yaml      # HireHub services
├── applicationsets/      # Multi-env deployment
│   └── hirehub-envs.yaml # dev/prod ApplicationSet
└── kong-plugins/         # Kong CRD manifests
```

## Development Commands

```bash
# 클러스터 관리
make cluster-up      # Kind 클러스터 생성
make cluster-down    # 클러스터 삭제

# 서비스 실행
make run-<service>   # 개별 서비스 실행
make deploy-all      # 전체 배포

# 테스트
make test-all        # 전체 테스트
make test-<service>  # 개별 테스트

# Proto
make proto           # gRPC proto 컴파일
```

## Key Patterns

### gRPC Service Template (Go)
```go
// services/<name>/cmd/main.go - 진입점
// services/<name>/internal/server/ - gRPC 핸들러
// services/<name>/internal/service/ - 비즈니스 로직
// services/<name>/internal/repository/ - DB 접근
```

### Spring Boot Service Template (Java)
```java
// services/<name>/src/main/java/com/hirehub/<name>/
//   ├── Application.java          - 진입점
//   ├── grpc/                      - gRPC 서비스 구현
//   ├── service/                   - 비즈니스 로직
//   ├── repository/                - JPA Repository
//   └── domain/                    - Entity, DTO
```

### Python Service Template
```python
# services/<name>/app/main.py - FastAPI 앱
# services/<name>/app/api/ - 라우터
# services/<name>/app/services/ - 비즈니스 로직
# services/<name>/app/models/ - Pydantic 모델
```

### Proto Definition
```
proto/
├── user/v1/user.proto
├── job/v1/job.proto
├── resume/v1/resume.proto
└── common/v1/common.proto
```

## Deployment Commands

```bash
# Terraform 배포 (AWS 리소스)
cd infrastructure/terraform/deploy
terraform init
terraform plan
terraform apply

# ArgoCD 설치 (EKS에서 한번만)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD Applications 배포
kubectl apply -f infrastructure/argocd/applications/

# Docker 이미지 빌드 및 푸시
./build-all.sh

# EKS kubeconfig 설정
aws eks update-kubeconfig --name demo-hirehub-eks --region ap-northeast-2
```

## Security Guidelines

### Network Security
- Kong NLB는 **Internal** scheme 사용 (외부 직접 노출 금지)
- 외부 접근은 CloudFront → ALB → Kong 경로로 구성
- CloudFront SG는 AWS Managed Prefix List (`com.amazonaws.global.cloudfront.origin-facing`) 사용
- Database 서브넷은 인터넷 접근 차단 (NAT Gateway만 허용)

### IAM & Pod Identity
- IRSA 대신 **Pod Identity** 사용 권장
- 서비스별 최소 권한 원칙 적용
- Secrets는 AWS Secrets Manager 또는 Kubernetes Secrets (sealed) 사용

### EKS Addons
| Addon | Description |
|-------|-------------|
| eks-pod-identity-agent | Pod Identity 지원 |
| vpc-cni | VPC 네이티브 네트워킹 |
| coredns | DNS 서비스 |
| kube-proxy | 네트워크 프록시 |

## Documentation

- `docs/database-schema.md` - 서비스별 DB 스키마, 워크플로우, Kafka 토픽
- `infrastructure/argocd/` - ArgoCD Application 매니페스트
- `infrastructure/terraform/` - Terraform 모듈 및 배포 설정
