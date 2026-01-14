# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HireHub** - AWS 클라우드 네이티브 기술을 활용한 AI 기반 채용 플랫폼 데모

## Demo Completion Status (2026-01-12)

### ✅ Completed Components
| Component | Status | Details |
|-----------|--------|---------|
| **EKS Cluster** | ✅ v1.34 | AL2023, Pod Identity, 2 nodes |
| **Docker Images** | ✅ 7/7 | All services built & pushed to ECR |
| **ArgoCD** | ✅ Deployed | Kong application configured |
| **Kong Gateway** | ✅ Running | Internal NLB |
| **RAG API** | ✅ Complete | `/api/v1/rag/query`, `/index`, `/delete` |
| **PII Service** | ✅ Complete | QWEN3 sLLM integration |
| **AgentCore** | ✅ Complete | Bedrock Agent integration |
| **Observability** | ✅ LGTM Stack | Loki, Grafana, Tempo, Mimir + ClickHouse |
| **Karpenter** | ✅ ArgoCD App | Node auto-scaling ready |
| **KEDA** | ✅ ArgoCD App | Pod event-driven scaling ready |
| **DR Failover** | ✅ Terraform | Lambda + ALB weighted routing |

### Infrastructure Versions
| Component | Version |
|-----------|---------|
| EKS | **1.34** (latest) |
| Node AMI | AL2023_x86_64_STANDARD |
| kube-proxy | v1.34.1-eksbuild.2 |
| vpc-cni | v1.21.1-eksbuild.1 |
| coredns | v1.12.4-eksbuild.1 |
| Terraform AWS Provider | >= 6.0 |

### ECR Repositories
All 7 services have images in ECR:
- `hirehub/user-service` ✅
- `hirehub/job-service` ✅
- `hirehub/resume-service` ✅
- `hirehub/apply-service` ✅
- `hirehub/match-service` ✅
- `hirehub/ai-service` ✅
- `hirehub/notification-service` ✅

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
- **GitOps**: ArgoCD (EKS Managed Capability + AWS Identity Center SSO)
- **IAM**: Pod Identity (preferred over IRSA)
- **Security**: CloudFront + Prefix-list SG for external access
- **LB Controller**: AWS Load Balancer Controller (Pod Identity)

### Deployment Strategy
| Layer | Tool | Description |
|-------|------|-------------|
| AWS 리소스 (VPC, EKS, Aurora 등) | Terraform | `infrastructure/terraform/` |
| EKS Addons | Terraform | EKS Blueprint addons |
| K8s 워크로드 (Kong, Services) | ArgoCD | `infrastructure/argocd/` |

### ArgoCD (EKS Managed Capability)
- **배포 방식**: EKS Capability (Terraform `aws_eks_capability`)
- **인증**: AWS Identity Center (SSO) 연동 필수
- **접속 URL**: https://argocd.aws.atomai.click (CloudFront → EKS Capability)
- **노드 리소스**: 사용 안 함 (EKS 컨트롤 플레인에서 실행)

```
infrastructure/argocd/
├── install/              # (Legacy) ArgoCD Helm values - 참조용
├── projects/             # AppProject (hirehub)
├── applications/         # Application manifests
│   ├── root-app.yaml     # App of Apps root
│   ├── alb-controller.yaml # AWS Load Balancer Controller
│   ├── kong.yaml         # Kong API Gateway
│   ├── kong-plugins.yaml # Kong plugins
│   └── hirehub.yaml      # HireHub services
├── applicationsets/      # Multi-env deployment
│   └── hirehub-envs.yaml # dev/prod ApplicationSet
└── kong-plugins/         # Kong CRD manifests + API routes
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
# Terraform 배포 (AWS 리소스 + EKS ArgoCD Capability)
cd infrastructure/terraform/deploy
terraform init
terraform plan
terraform apply

# ArgoCD 접속 (EKS Managed - AWS Identity Center SSO로 로그인)
# URL: https://argocd.aws.atomai.click
# 또는 직접 접속: terraform output argocd_server_url

# ArgoCD Applications 배포 (ArgoCD UI 또는 kubectl)
kubectl apply -f infrastructure/argocd/applications/

# Docker 이미지 빌드 및 푸시
./build-all.sh

# EKS kubeconfig 설정
aws eks update-kubeconfig --name demo-hirehub-eks --region ap-northeast-2

# EKS 클러스터 인증 모드 확인 (API_AND_CONFIG_MAP 필요)
aws eks describe-cluster --name demo-hirehub-eks --query 'cluster.accessConfig'
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

### EKS Addons & Capabilities
| Addon/Capability | Description |
|------------------|-------------|
| eks-pod-identity-agent | Pod Identity 지원 |
| vpc-cni | VPC 네이티브 네트워킹 |
| coredns | DNS 서비스 |
| kube-proxy | 네트워크 프록시 |
| **ArgoCD Capability** | EKS Managed GitOps (AWS Identity Center 연동) |
| **AWS LB Controller** | NLB/ALB 관리 (Pod Identity 사용) |

## Observability Stack (LGTM + Multi-Backend)

### Architecture
```
┌──────────────────────────────────────────────────────────┐
│                    EKS Cluster                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │           OTEL Collector (DaemonSet)            │     │
│  │    Receivers: OTLP, filelog (container logs)    │     │
│  └──────┬──────────┬──────────┬──────────┬─────────┘     │
│         │          │          │          │               │
│         ▼          ▼          ▼          ▼               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Loki    │ │  Tempo   │ │  Mimir   │ │ClickHouse│    │
│  │ (Logs)   │ │ (Traces) │ │(Metrics) │ │(SQL Logs)│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│         └──────────┴──────────┴──────────┘               │
│                         │                                │
│                   ┌─────▼─────┐                          │
│                   │  Grafana  │                          │
│                   │(5 sources)│                          │
│                   └───────────┘                          │
└──────────────────────────────────────────────────────────┘
```

### Components
| Component | Mode | Purpose | Query Language |
|-----------|------|---------|----------------|
| **Loki** | SimpleScalable | Real-time logs | LogQL |
| **Tempo** | Distributed | Distributed tracing | TraceQL |
| **Mimir** | Distributed | Long-term metrics | PromQL |
| **ClickHouse** | Single node | SQL log analytics | SQL |
| **Grafana** | Single | Unified visualization | - |
| **OTEL Collector** | DaemonSet | Telemetry collection | - |

### ArgoCD Applications
```
infrastructure/argocd/applications/
├── loki.yaml              # Loki SimpleScalable
├── tempo.yaml             # Tempo Distributed
├── mimir.yaml             # Mimir Distributed
├── clickhouse.yaml        # ClickHouse single node
├── otel-collector.yaml    # OTEL Collector DaemonSet
└── grafana-lgtm.yaml      # Grafana + All Datasources
```

### Grafana Datasources
| Datasource | Type | Usage |
|------------|------|-------|
| Loki | Built-in | Real-time log search, LogQL |
| Tempo | Built-in | Trace visualization, TraceQL |
| Mimir | prometheus | Long-term metrics, PromQL |
| ClickHouse | Plugin | SQL-based log analytics |
| OpenSearch | Plugin | Full-text search (AWS Managed) |

### Access
```bash
# Grafana (port-forward)
kubectl port-forward svc/grafana -n monitoring 3000:3000
# URL: http://localhost:3000
# User: admin / Password: grafana123

# Sample Queries
# Loki: {namespace="kong"} |= "request"
# ClickHouse: SELECT * FROM otel.logs WHERE ServiceName='kong' LIMIT 10
```

## Documentation

- `docs/database-schema.md` - 서비스별 DB 스키마, 워크플로우, Kafka 토픽
- `infrastructure/argocd/` - ArgoCD Application 매니페스트
- `infrastructure/terraform/` - Terraform 모듈 및 배포 설정
