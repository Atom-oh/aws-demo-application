-- Notification Service Database Schema
-- Implements Outbox Pattern for reliable event publishing

-- Notification Templates Table
-- Stores templates for different notification types and channels
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster template lookup by event type
CREATE INDEX idx_notification_templates_event_type ON notification_templates(event_type);
CREATE INDEX idx_notification_templates_channel ON notification_templates(channel);

-- Notifications Table
-- Stores all sent notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    channel VARCHAR(20) NOT NULL,
    title VARCHAR(200),
    content TEXT,
    data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Notification Outbox Table (Transactional Outbox Pattern)
-- Ensures reliable event publishing with at-least-once delivery
CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    next_retry_at TIMESTAMP
);

-- Index for outbox polling
CREATE INDEX idx_notification_outbox_status ON notification_outbox(status) WHERE status = 'pending';
CREATE INDEX idx_notification_outbox_retry ON notification_outbox(next_retry_at) WHERE status = 'pending';

-- Device Tokens Table
-- Stores device tokens for push notifications
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_type VARCHAR(20),
    token VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token)
);

-- Index for device token lookup
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON device_tokens(user_id, is_active) WHERE is_active = true;

-- User Notification Settings Table
-- Stores user preferences for notifications
CREATE TABLE user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    disabled_event_types TEXT[],
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for settings lookup
CREATE INDEX idx_user_notification_settings_user_id ON user_notification_settings(user_id);

-- Insert default notification templates
INSERT INTO notification_templates (name, event_type, channel, subject_template, body_template) VALUES
-- Resume processed notifications
('resume_processed_email', 'resume.processed', 'email',
 '이력서 분석이 완료되었습니다',
 '<h2>안녕하세요, {{.user_name}}님!</h2><p>등록하신 이력서의 분석이 완료되었습니다.</p><p>지금 바로 <a href="{{.resume_url}}">이력서 분석 결과</a>를 확인해보세요.</p>'),

('resume_processed_push', 'resume.processed', 'push',
 '이력서 분석 완료',
 '등록하신 이력서 분석이 완료되었습니다. 결과를 확인해보세요!'),

-- Job created notifications
('job_created_email', 'job.created', 'email',
 '새로운 채용공고: {{.job_title}}',
 '<h2>관심 있으실 만한 채용공고가 등록되었습니다!</h2><p><strong>{{.company_name}}</strong>에서 <strong>{{.job_title}}</strong> 포지션을 모집합니다.</p><p><a href="{{.job_url}}">채용공고 보기</a></p>'),

('job_created_push', 'job.created', 'push',
 '새 채용공고',
 '{{.company_name}}에서 {{.job_title}} 포지션을 모집합니다'),

-- Match recommended notifications
('match_recommended_email', 'match.recommended', 'email',
 '맞춤 채용공고를 추천드립니다',
 '<h2>{{.user_name}}님을 위한 맞춤 채용공고</h2><p>AI가 분석한 결과, 아래 채용공고가 {{.match_score}}% 매칭됩니다.</p><p><strong>{{.company_name}}</strong> - {{.job_title}}</p><p><a href="{{.job_url}}">자세히 보기</a></p>'),

('match_recommended_push', 'match.recommended', 'push',
 '맞춤 채용공고 추천',
 '{{.company_name}}의 {{.job_title}} 포지션이 {{.match_score}}% 매칭됩니다'),

-- Application submitted notifications
('application_submitted_email', 'application.submitted', 'email',
 '지원이 완료되었습니다 - {{.job_title}}',
 '<h2>지원해주셔서 감사합니다!</h2><p><strong>{{.company_name}}</strong>의 <strong>{{.job_title}}</strong> 포지션에 지원이 완료되었습니다.</p><p>지원번호: {{.application_id}}</p><p>진행 상황은 마이페이지에서 확인하실 수 있습니다.</p>'),

('application_submitted_push', 'application.submitted', 'push',
 '지원 완료',
 '{{.company_name}} - {{.job_title}} 지원이 완료되었습니다'),

-- Application status changed notifications
('application_status_changed_email', 'application.status_changed', 'email',
 '지원 현황이 업데이트되었습니다',
 '<h2>지원 현황 안내</h2><p><strong>{{.company_name}}</strong>의 <strong>{{.job_title}}</strong> 포지션 지원 상태가 <strong>{{.new_status}}</strong>(으)로 변경되었습니다.</p><p><a href="{{.application_url}}">상세 내용 확인</a></p>'),

('application_status_changed_push', 'application.status_changed', 'push',
 '지원 현황 업데이트',
 '{{.job_title}} 지원 상태: {{.new_status}}'),

-- Interview scheduled notifications
('interview_scheduled_email', 'interview.scheduled', 'email',
 '면접 일정 안내 - {{.company_name}}',
 '<h2>면접 일정이 확정되었습니다!</h2><p><strong>{{.company_name}}</strong>의 <strong>{{.job_title}}</strong> 포지션 면접이 예정되어 있습니다.</p><p>일시: {{.interview_datetime}}</p><p>장소: {{.interview_location}}</p><p>면접 유형: {{.interview_type}}</p><p><a href="{{.interview_url}}">상세 정보 확인</a></p>'),

('interview_scheduled_push', 'interview.scheduled', 'push',
 '면접 일정 확정',
 '{{.company_name}} 면접: {{.interview_datetime}}'),

('interview_scheduled_sms', 'interview.scheduled', 'sms',
 NULL,
 '[HireHub] {{.company_name}} 면접 안내\n일시: {{.interview_datetime}}\n장소: {{.interview_location}}');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_tokens_updated_at
    BEFORE UPDATE ON device_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
