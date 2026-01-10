# Database Schema

HireHub 데이터베이스 스키마 및 워크플로우 정의

## 서비스별 DB 구성

| 서비스 | Primary DB | 보조 저장소 | 패턴 |
|--------|-----------|------------|------|
| user-service | PostgreSQL | Redis (세션) | Cognito Sub 연동 |
| job-service | PostgreSQL | OpenSearch (검색) | CQRS (쓰기/읽기 분리) |
| resume-service | PostgreSQL | S3 (파일), pgvector | 파일 + 벡터 |
| apply-service | PostgreSQL | - | Event Sourcing (상태 이력) |
| match-service | PostgreSQL | Redis (캐시) | 점수 캐싱 |
| ai-service | PostgreSQL | pgvector | 임베딩 저장 |
| notification-service | PostgreSQL | Redis (큐) | Outbox 패턴 |

---

## 1. user-service

### 테이블

```sql
-- 사용자 (Cognito 연동)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,  -- 'jobseeker', 'company', 'admin'
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 구직자 프로필
CREATE TABLE jobseeker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    phone VARCHAR(20),
    experience_years INT,
    desired_position VARCHAR(100),
    desired_salary_min INT,
    desired_salary_max INT,
    skills TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기업
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    business_number VARCHAR(20) UNIQUE,
    industry VARCHAR(100),
    company_size VARCHAR(50),  -- '1-10', '11-50', '51-200', '201-500', '500+'
    location VARCHAR(200),
    logo_url VARCHAR(500),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기업 담당자
CREATE TABLE company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100),
    position VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

```sql
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_jobseeker_profiles_user_id ON jobseeker_profiles(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
```

---

## 2. job-service

### 테이블

```sql
-- 채용공고
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    job_type VARCHAR(50),        -- 'full-time', 'contract', 'intern'
    experience_level VARCHAR(50), -- 'entry', 'junior', 'mid', 'senior'
    experience_min INT,
    experience_max INT,
    salary_min INT,
    salary_max INT,
    location VARCHAR(200),
    remote_type VARCHAR(50),     -- 'onsite', 'remote', 'hybrid'
    status VARCHAR(20) DEFAULT 'draft',  -- 'draft', 'open', 'closed'
    views_count INT DEFAULT 0,
    applies_count INT DEFAULT 0,
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 스킬 태그 (마스터)
CREATE TABLE skill_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50)  -- 'language', 'framework', 'database', 'cloud'
);

-- 채용공고-스킬 연결
CREATE TABLE job_skills (
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_tags(id),
    is_required BOOLEAN DEFAULT true,
    PRIMARY KEY (job_id, skill_id)
);
```

### 인덱스

```sql
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_skill_tags_category ON skill_tags(category);
```

### OpenSearch 인덱스

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "korean": {
          "type": "custom",
          "tokenizer": "nori_tokenizer"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "company_id": { "type": "keyword" },
      "company_name": { "type": "text", "analyzer": "korean" },
      "title": { "type": "text", "analyzer": "korean" },
      "description": { "type": "text", "analyzer": "korean" },
      "requirements": { "type": "text", "analyzer": "korean" },
      "skills": { "type": "keyword" },
      "job_type": { "type": "keyword" },
      "experience_level": { "type": "keyword" },
      "experience_min": { "type": "integer" },
      "experience_max": { "type": "integer" },
      "salary_min": { "type": "integer" },
      "salary_max": { "type": "integer" },
      "location": { "type": "keyword" },
      "remote_type": { "type": "keyword" },
      "status": { "type": "keyword" },
      "posted_at": { "type": "date" },
      "expires_at": { "type": "date" }
    }
  }
}
```

---

## 3. resume-service

### 테이블

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 이력서
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200),
    original_file_url VARCHAR(500),   -- S3 경로
    original_file_name VARCHAR(255),
    file_type VARCHAR(50),            -- 'pdf', 'docx'
    masked_content TEXT,              -- PII 제거된 텍스트
    parsed_content JSONB,             -- 구조화된 파싱 결과
    ai_summary TEXT,
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'processing',  -- 'processing', 'ready', 'error'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 이력서 경력사항
CREATE TABLE resume_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    position VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    description TEXT
);

-- 이력서 스킬
CREATE TABLE resume_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    skill_name VARCHAR(100),
    proficiency VARCHAR(20),  -- 'beginner', 'intermediate', 'advanced', 'expert'
    years INT
);

-- 이력서 학력
CREATE TABLE resume_educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    school_name VARCHAR(200),
    degree VARCHAR(100),
    major VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false
);

-- 이력서 벡터 임베딩 (RAG용)
CREATE TABLE resume_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    chunk_index INT,
    chunk_text TEXT,
    embedding vector(1536),  -- Titan/OpenAI 임베딩
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PII 마스킹 로그
CREATE TABLE pii_masking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    masked_fields JSONB,  -- {"name": "***", "phone": "***-****-****"}
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

```sql
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resume_experiences_resume_id ON resume_experiences(resume_id);
CREATE INDEX idx_resume_skills_resume_id ON resume_skills(resume_id);
CREATE INDEX idx_resume_skills_skill_name ON resume_skills(skill_name);

-- 벡터 검색 인덱스
CREATE INDEX idx_resume_embeddings_vector
ON resume_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### S3 버킷 구조

```
s3://hirehub-resumes-{env}/
├── original/
│   └── {user_id}/
│       └── {resume_id}/
│           └── {filename}.pdf
└── processed/
    └── {user_id}/
        └── {resume_id}/
            ├── masked.txt
            └── parsed.json
```

---

## 4. apply-service

### 테이블

```sql
-- 지원 내역
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resume_id UUID NOT NULL,
    cover_letter TEXT,
    status VARCHAR(30) DEFAULT 'submitted',
    -- 'submitted', 'reviewing', 'interview_scheduled',
    -- 'interview_completed', 'offered', 'accepted', 'rejected', 'withdrawn'
    match_score DECIMAL(5,2),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)  -- 동일 공고 중복 지원 방지
);

-- 상태 변경 이력 (Event Sourcing)
CREATE TABLE application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,  -- 'status_changed', 'interview_scheduled', 'feedback_added'
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    actor_id UUID,        -- 변경한 사용자
    actor_type VARCHAR(20), -- 'jobseeker', 'company', 'system'
    payload JSONB,        -- 추가 데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 면접 일정
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_type VARCHAR(30),  -- 'phone', 'video', 'onsite', 'assignment'
    scheduled_at TIMESTAMP,
    duration_minutes INT,
    location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled'
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

```sql
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);
CREATE INDEX idx_application_events_application_id ON application_events(application_id);
CREATE INDEX idx_application_events_created_at ON application_events(created_at DESC);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);
```

### 상태 전이 다이어그램

```
                    ┌─────────────┐
                    │  submitted  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ rejected │ │reviewing │ │withdrawn │
        └──────────┘ └────┬─────┘ └──────────┘
                          │
                          ▼
                ┌──────────────────┐
                │interview_scheduled│
                └────────┬─────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────────┐ ┌──────────┐
        │ rejected │ │interview_    │ │withdrawn │
        └──────────┘ │completed     │ └──────────┘
                     └──────┬───────┘
                            │
                 ┌──────────┼──────────┐
                 │          │          │
                 ▼          ▼          ▼
           ┌──────────┐ ┌───────┐ ┌──────────┐
           │ rejected │ │offered│ │withdrawn │
           └──────────┘ └───┬───┘ └──────────┘
                            │
                 ┌──────────┼──────────┐
                 │          │          │
                 ▼          ▼          ▼
           ┌──────────┐ ┌────────┐ ┌──────────┐
           │ rejected │ │accepted│ │withdrawn │
           └──────────┘ └────────┘ └──────────┘
```

---

## 5. match-service

### 테이블

```sql
-- 매칭 결과
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    resume_id UUID NOT NULL,
    user_id UUID NOT NULL,
    overall_score DECIMAL(5,2),      -- 종합 (0-100)
    skill_score DECIMAL(5,2),        -- 스킬 매칭
    experience_score DECIMAL(5,2),   -- 경력 매칭
    culture_score DECIMAL(5,2),      -- 문화 적합도
    score_breakdown JSONB,           -- 상세 breakdown
    ai_reasoning TEXT,               -- AI 분석 이유
    is_recommended BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, resume_id)
);

-- 매칭 피드백 (모델 학습용)
CREATE TABLE match_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    feedback_type VARCHAR(20),  -- 'helpful', 'not_helpful', 'hired', 'rejected'
    feedback_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

```sql
CREATE INDEX idx_matches_job_id ON matches(job_id);
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_overall_score ON matches(overall_score DESC);
CREATE INDEX idx_matches_is_recommended ON matches(is_recommended) WHERE is_recommended = true;
```

### Redis 캐시 구조

```
# 채용공고별 상위 매칭 (ZSET)
match:job:{job_id}:top
  - member: resume_id
  - score: overall_score
  - TTL: 1h

# 구직자별 추천 공고 (ZSET)
match:user:{user_id}:recommended
  - member: job_id
  - score: overall_score
  - TTL: 1h

# 매칭 상세 캐시 (STRING)
match:detail:{job_id}:{resume_id}
  - value: JSON
  - TTL: 1h
```

---

## 6. ai-service

### 테이블

```sql
-- AI 작업 로그
CREATE TABLE ai_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL,  -- 'pii_masking', 'parsing', 'embedding', 'matching', 'summary'
    source_type VARCHAR(50),         -- 'resume', 'job'
    source_id UUID,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    model_used VARCHAR(100),         -- 'qwen3-8b', 'claude-3-sonnet'
    tokens_used INT,
    processing_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 채용공고 벡터 임베딩
CREATE TABLE job_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    chunk_index INT,
    chunk_text TEXT,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

```sql
CREATE INDEX idx_ai_tasks_source ON ai_tasks(source_type, source_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_created_at ON ai_tasks(created_at DESC);

-- 벡터 검색 인덱스
CREATE INDEX idx_job_embeddings_vector
ON job_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 7. notification-service

### 테이블

```sql
-- 알림 템플릿
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'application_submitted', 'status_changed'
    channel VARCHAR(20) NOT NULL,     -- 'email', 'push', 'sms', 'in_app'
    subject_template TEXT,
    body_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 알림 발송 내역
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    channel VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    content TEXT,
    data JSONB,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed', 'read'
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outbox 패턴 (Kafka 발행 보장)
CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'published'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- 디바이스 토큰 (푸시)
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_type VARCHAR(20),  -- 'ios', 'android', 'web'
    token VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 알림 설정
CREATE TABLE user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    disabled_event_types TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_outbox_status ON notification_outbox(status) WHERE status = 'pending';
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
```

### 알림 템플릿 예시

```sql
INSERT INTO notification_templates (name, event_type, channel, subject_template, body_template) VALUES
('application_submitted_email', 'application.submitted', 'email',
 '새로운 지원자가 있습니다: {{job_title}}',
 '{{applicant_name}}님이 {{job_title}} 포지션에 지원했습니다.\n\n매칭 점수: {{match_score}}점\n\n지원서 확인하기: {{application_url}}'),

('status_changed_push', 'application.status_changed', 'push',
 '지원 상태가 변경되었습니다',
 '{{company_name}}의 {{job_title}} 지원 상태가 "{{new_status}}"로 변경되었습니다.'),

('interview_scheduled_email', 'interview.scheduled', 'email',
 '면접 일정이 확정되었습니다: {{company_name}}',
 '{{company_name}}의 {{job_title}} 포지션 면접이 예정되었습니다.\n\n일시: {{scheduled_at}}\n장소: {{location}}\n\n자세한 내용은 앱에서 확인해주세요.');
```

---

## Kafka 토픽

| 토픽 | Producer | Consumer | Payload |
|------|----------|----------|---------|
| `resume.uploaded` | resume-service | ai-service | `{resume_id, user_id, file_url}` |
| `resume.processed` | ai-service | notification-service | `{resume_id, user_id, status}` |
| `job.created` | job-service | ai-service | `{job_id, company_id}` |
| `job.updated` | job-service | ai-service | `{job_id, updated_fields}` |
| `match.calculated` | ai-service | match-service | `{job_id, resume_id, scores}` |
| `match.recommended` | match-service | notification-service | `{user_id, job_id, score}` |
| `application.submitted` | apply-service | notification-service, job-service | `{application_id, job_id, user_id}` |
| `application.status_changed` | apply-service | notification-service | `{application_id, from_status, to_status}` |
| `interview.scheduled` | apply-service | notification-service | `{interview_id, application_id, scheduled_at}` |

---

## 워크플로우 다이어그램

### 1. 이력서 업로드 → PII 제거 → AI 분석

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│   resume-   │────►│     S3      │     │  ai-service │
│             │     │   service   │     │             │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘     └──────▲──────┘
                           │                                       │
                           │ INSERT resumes                        │
                           │ (status=processing)                   │
                           ▼                                       │
                    ┌─────────────┐                               │
                    │ PostgreSQL  │                               │
                    │  (resume)   │                               │
                    └─────────────┘                               │
                           │                                       │
                           │ Kafka: resume.uploaded               │
                           └───────────────────────────────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  ai-service   │
            │               │
            │ 1. S3 다운로드 │
            │ 2. QWEN3 PII  │
            │ 3. 파싱       │
            │ 4. 임베딩     │
            │ 5. 요약       │
            └───────┬───────┘
                    │
                    │ API: PUT /resumes/{id}
                    ▼
            ┌─────────────┐     Kafka: resume.processed     ┌─────────────┐
            │   resume-   │────────────────────────────────►│notification-│
            │   service   │                                 │   service   │
            │             │                                 │             │
            │ UPDATE      │                                 │ 알림 발송   │
            │ status=ready│                                 │             │
            └─────────────┘                                 └─────────────┘
```

### 2. 채용공고 등록 → AI 매칭 → 추천

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│job-service  │────►│ OpenSearch  │
│  (기업)     │     │             │     │  (인덱싱)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           │ INSERT jobs
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    │   (job)     │
                    └──────┬──────┘
                           │
                           │ Kafka: job.created
                           ▼
                    ┌─────────────┐
                    │ ai-service  │
                    │             │
                    │ 1. 임베딩   │
                    │ 2. 벡터검색 │
                    │ 3. 점수계산 │
                    └──────┬──────┘
                           │
                           │ Kafka: match.calculated
                           ▼
                    ┌─────────────┐
                    │match-service│
                    │             │
                    │ INSERT/     │
                    │ UPDATE      │
                    │ matches     │
                    └──────┬──────┘
                           │
                           │ Kafka: match.recommended
                           ▼
                    ┌─────────────┐
                    │notification-│
                    │   service   │
                    │             │
                    │ 적합 구직자 │
                    │ 추천 알림   │
                    └─────────────┘
```

### 3. 지원 → 상태 추적 → 알림

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│apply-service│────►│match-service│
│  (구직자)   │     │             │◄────│ (점수 조회) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           │ INSERT applications
                           │ INSERT application_events
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    │  (apply)    │
                    └──────┬──────┘
                           │
                           │ Kafka: application.submitted
                           ▼
                    ┌─────────────┐
                    │notification-│
                    │   service   │
                    │             │
                    │ → 기업 알림 │
                    └─────────────┘

[상태 변경 시 - 기업 담당자]

┌─────────────┐     ┌─────────────┐
│   Client    │────►│apply-service│
│   (기업)    │     │             │
└─────────────┘     └──────┬──────┘
                           │
                           │ UPDATE applications.status
                           │ INSERT application_events
                           │
                           │ Kafka: application.status_changed
                           ▼
                    ┌─────────────┐
                    │notification-│
                    │   service   │
                    │             │
                    │ → 구직자    │
                    │   알림      │
                    └─────────────┘
```

---

## Aurora PostgreSQL 구성

### 클러스터 구성

```
Aurora PostgreSQL Cluster
├── Writer Instance (db.r6g.large)
│   └── 모든 서비스 쓰기 작업
├── Reader Instance 1 (db.r6g.large)
│   └── 읽기 부하 분산
└── Reader Instance 2 (db.r6g.large)
    └── 읽기 부하 분산 (Auto Scaling)
```

### 데이터베이스 분리

```sql
-- 서비스별 데이터베이스 생성
CREATE DATABASE hirehub_user;
CREATE DATABASE hirehub_job;
CREATE DATABASE hirehub_resume;
CREATE DATABASE hirehub_apply;
CREATE DATABASE hirehub_match;
CREATE DATABASE hirehub_ai;
CREATE DATABASE hirehub_notification;

-- 서비스별 사용자 생성
CREATE USER user_svc WITH PASSWORD '...';
CREATE USER job_svc WITH PASSWORD '...';
-- ... 각 서비스별 사용자

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE hirehub_user TO user_svc;
GRANT ALL PRIVILEGES ON DATABASE hirehub_job TO job_svc;
-- ... 각 서비스별 권한
```

---

## 마이그레이션 전략

각 서비스는 독립적인 마이그레이션을 관리합니다.

### Go 서비스 (golang-migrate)

```bash
# 마이그레이션 생성
migrate create -ext sql -dir migrations -seq create_users_table

# 마이그레이션 실행
migrate -database "postgres://..." -path migrations up
```

### Java 서비스 (Flyway)

```
resources/db/migration/
├── V1__create_jobs_table.sql
├── V2__create_skill_tags_table.sql
└── V3__create_job_skills_table.sql
```

### Python 서비스 (Alembic)

```bash
# 마이그레이션 생성
alembic revision --autogenerate -m "create resumes table"

# 마이그레이션 실행
alembic upgrade head
```
