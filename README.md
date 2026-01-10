# HireHub - AI 채용 플랫폼

AWS 클라우드 네이티브 기술을 활용한 AI 기반 채용 플랫폼 데모 애플리케이션

## 주요 기능

| 기능 | 설명 |
|------|------|
| **AI 이력서 분석** | PDF/Word 이력서 업로드 → RAG 기반 분석 → JD 매칭 |
| **PII 자동 마스킹** | sLLM(QWEN3)으로 개인정보(이름, 연락처, 주민번호) 자동 제거 |
| **스마트 매칭** | AgentCore 기반 구직자-채용공고 AI 매칭 |
| **실시간 알림** | MSK를 통한 지원/면접/합격 알림 |
| **소셜 로그인** | Cognito + Google/Kakao/Naver 연동 |

---

## 서비스 아키텍처

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    Amazon Cognito                                         │
│            ┌─────────────────────────────┐    ┌─────────────────────────────┐            │
│            │   User Pool (일반 사용자)     │    │   User Pool (Admin)          │            │
│            │  • 구직자/기업 회원            │    │  • 관리자 전용                 │            │
│            │  • 소셜로그인 (Google/Kakao)  │    │  • MFA 필수                   │            │
│            └─────────────────────────────┘    └─────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                          │                                    │
                          ▼                                    ▼
              ┌─────────────────────┐              ┌─────────────────────┐
              │    Web Frontend     │              │   Admin Dashboard   │
              │     (Next.js)       │              │     (Next.js)       │
              └─────────────────────┘              └─────────────────────┘
                          │                                    │
                          └──────────────┬─────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Kong API Gateway                                │
│                    (Ingress, Rate Limiting, Circuit Breaker, JWT 검증)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│  user-service │◄────gRPC────►│  job-service  │◄────gRPC────►│ resume-service│
│   (회원관리)   │              │  (채용공고)    │              │  (이력서/PII) │
└───────────────┘              └───────────────┘              └───────────────┘
        │                               │                               │
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ apply-service │◄────gRPC────►│match-service  │◄────gRPC────►│  ai-service   │
│  (지원관리)    │              │  (AI 매칭)     │              │ (AgentCore)   │
└───────────────┘              └───────────────┘              └───────────────┘
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │   notification-service   │
                          │     (알림/이메일/푸시)    │
                          └─────────────────────────┘
                                        │
                                        ▼
                          ┌─────────────────────────┐
                          │      Amazon MSK          │
                          │   (Kafka - 비동기 통신)   │
                          └─────────────────────────┘
```

---

## 마이크로서비스 구성

| 서비스 | 포트 | 기술 스택 | 역할 |
|--------|------|----------|------|
| `user-service` | 8001 | Go + gRPC | 회원 관리 (구직자/기업/어드민) |
| `job-service` | 8002 | Java + Spring Boot + gRPC | 채용공고 CRUD, 검색 |
| `resume-service` | 8003 | Python + FastAPI | 이력서 업로드, PII 제거, 파싱 |
| `apply-service` | 8004 | Go + gRPC | 지원 관리, 상태 추적 |
| `match-service` | 8005 | Python + FastAPI | AI 매칭 엔진 |
| `ai-service` | 8006 | Python + FastAPI | AgentCore, RAG, sLLM |
| `notification-service` | 8007 | Go + Kafka | 알림 발송 (이메일/푸시/SMS) |
| `admin-dashboard` | 3000 | Next.js | 어드민 대시보드 |
| `web-frontend` | 3001 | Next.js | 사용자 웹앱 |

---

## 인프라 구성

### Container Orchestration (EKS + ECS DR)
```
                      ┌─────────────┐
                      │     ALB     │
                      │ Weighted TG │
                      └──────┬──────┘
               ┌─────────────┴─────────────┐
               ▼                           ▼
        ┌─────────────┐             ┌─────────────┐
        │     EKS     │             │     ECS     │
        │  (Primary)  │             │    (DR)     │
        │   100%      │◄──switch───►│    0%       │
        │  Karpenter  │             │  Managed    │
        │    KEDA     │             │  Instance   │
        └─────────────┘             └─────────────┘
```

- **EKS (Primary)**: Karpenter 노드 스케일링, KEDA Pod 스케일링
- **ECS (DR - Hot Standby)**: Managed Instance, 최소 1개 상시 실행
- **ALB Weighted Target Group**: Admin에서 DR 전환 시 가중치 변경
- **전환 시나리오**: Normal(100:0) → DR(0:100) → Canary(90:10)

### Data Stores
- **Aurora PostgreSQL**: 사용자, 채용공고, 지원 데이터
- **Amazon OpenSearch**: 채용공고/이력서 풀텍스트 검색
- **ElastiCache Redis**: 세션, 캐싱
- **S3**: 이력서 파일 저장

### AI/ML
- **Amazon Bedrock**: AgentCore 기반 AI Agent
- **QWEN3 on EKS**: PII 제거용 sLLM (vLLM 서빙)
- **Bedrock Knowledge Base**: 이력서 RAG

### Messaging & Auth
- **Amazon MSK**: Kafka 기반 이벤트 스트리밍
- **Amazon Cognito**: 인증/인가
  - **User Pool (일반)**: 구직자/기업 회원 + 소셜 로그인 (Google, Kakao, Naver)
  - **User Pool (Admin)**: 관리자 전용, MFA 필수, 소셜 로그인 미지원

### Observability
| 영역 | 도구 |
|------|------|
| Metrics | Prometheus + CloudWatch |
| Tracing | AWS X-Ray (ADOT) |
| Logging | CloudWatch Logs + Fluent Bit |
| Dashboard | Grafana + CloudWatch |

### API Gateway
- **Kong Gateway**: API Gateway, Rate Limiting, Circuit Breaker, Auth (JWT/OAuth2)

---

## 프로젝트 구조

```
demo/
├── services/
│   ├── user-service/         # Go
│   ├── job-service/          # Java (Spring Boot)
│   ├── resume-service/       # Python
│   ├── apply-service/        # Go
│   ├── match-service/        # Python
│   ├── ai-service/           # Python
│   └── notification-service/ # Go
├── frontend/
│   ├── web/                  # Next.js (사용자)
│   └── admin/                # Next.js (어드민)
├── infra/
│   ├── terraform/            # AWS 인프라
│   ├── helm/                 # Kubernetes 배포
│   └── cdk/                  # (선택) CDK 버전
├── proto/                    # gRPC Proto 정의
├── scripts/
│   ├── mock-data/            # Mock data 생성 스크립트
│   │   ├── seed.py           # 메인 시더
│   │   ├── generators/       # 데이터 생성기
│   │   └── resumes/          # 샘플 이력서 PDF
│   └── utils/                # 유틸리티 스크립트
└── docs/                     # 문서
```

---

## 핵심 시나리오

### 1. 이력서 업로드 → PII 제거 → AI 분석
```
1. 구직자가 이력서 PDF 업로드
2. resume-service → S3 저장
3. ai-service (QWEN3) → PII 마스킹 (이름→OOO, 전화→***-****-****)
4. ai-service (RAG) → 이력서 벡터화 및 저장
5. Kafka → notification-service → "이력서 분석 완료" 알림
```

### 2. 채용공고 등록 → AI 매칭 → 추천
```
1. 기업이 채용공고(JD) 등록
2. job-service → OpenSearch 인덱싱
3. match-service → 기존 이력서와 AI 매칭 (AgentCore)
4. 적합 구직자에게 Kafka → 알림 발송
```

### 3. 지원 → 상태 추적 → 알림
```
1. 구직자가 채용공고에 지원
2. apply-service → 지원 레코드 생성
3. Kafka → notification-service → 기업에 알림
4. 기업이 상태 변경 (서류검토→면접→합격)
5. 각 단계마다 Kafka → 구직자에게 알림
```

### 4. DR 전환 (EKS → ECS)
```
1. Admin Dashboard에서 "DR 전환" 버튼 클릭
2. Lambda → ALB Listener Rule 가중치 변경
   - EKS Target Group: 100% → 0%
   - ECS Target Group: 0% → 100%
3. ECS Auto Scaling → 트래픽 증가에 따라 태스크 확장
4. 모니터링: CloudWatch 대시보드에서 전환 상태 확인
5. 복구 시: 역순으로 가중치 변경
```

---

## Mock Data

데모용 샘플 데이터 자동 생성

### 데이터 구성

| 엔티티 | 수량 | 설명 |
|--------|------|------|
| **구직자** | 500명 | 다양한 경력/스킬셋 |
| **기업** | 50개 | 스타트업 ~ 대기업 |
| **채용공고** | 200개 | 개발/기획/디자인 등 |
| **이력서** | 500개 | PDF 샘플 포함 |
| **지원내역** | 1,000건 | 다양한 상태 (서류검토/면접/합격/불합격) |

### 샘플 데이터 예시

```json
// 구직자
{
  "id": "user-001",
  "name": "김개발",
  "email": "dev.kim@example.com",
  "skills": ["Go", "Kubernetes", "AWS"],
  "experience_years": 5,
  "desired_position": "Backend Engineer",
  "desired_salary": 7000
}

// 기업
{
  "id": "company-001",
  "name": "테크스타트업",
  "industry": "IT/소프트웨어",
  "size": "50-100명",
  "location": "서울 강남구"
}

// 채용공고
{
  "id": "job-001",
  "company_id": "company-001",
  "title": "Senior Backend Engineer",
  "skills_required": ["Go", "gRPC", "Kubernetes"],
  "experience_min": 3,
  "salary_range": {"min": 6000, "max": 9000},
  "status": "open"
}

// 이력서 (PII 마스킹 후)
{
  "id": "resume-001",
  "user_id": "user-001",
  "original_file": "s3://resumes/user-001.pdf",
  "masked_content": "이름: ***  연락처: ***-****-****\n경력: 5년\n기술: Go, Kubernetes...",
  "extracted_skills": ["Go", "Kubernetes", "AWS", "Docker"],
  "ai_summary": "5년차 백엔드 개발자, 클라우드 인프라 경험 풍부..."
}
```

### Mock Data 생성

```bash
# 전체 mock data 생성
make seed-all

# 개별 생성
make seed-users      # 구직자/기업 사용자
make seed-companies  # 기업 정보
make seed-jobs       # 채용공고
make seed-resumes    # 이력서 (PDF 생성 포함)
make seed-applies    # 지원내역

# Mock data 초기화
make seed-reset
```

### 이력서 PDF 샘플

`scripts/mock-data/resumes/` 디렉토리에 다양한 형태의 샘플 이력서 PDF 포함:
- 신입 이력서 (경력 0-2년)
- 경력 이력서 (3-7년)
- 시니어 이력서 (8년+)
- 다양한 직군 (개발/기획/디자인/마케팅)

---

## 로컬 개발 환경

```bash
# 의존성 설치 (Docker, kubectl, helm 필요)
make setup

# 로컬 Kubernetes (Kind) 클러스터 생성
make cluster-up

# 모든 서비스 배포
make deploy-all

# 개별 서비스 실행
make run-user-service
make run-ai-service

# 테스트
make test-all
```

---

## 라이선스

MIT License
