-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resume_id UUID NOT NULL,
    cover_letter TEXT,
    status VARCHAR(30) DEFAULT 'submitted',
    match_score DECIMAL(5,2),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);

-- Application events table (Event Sourcing)
CREATE TABLE IF NOT EXISTS application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    actor_id UUID,
    actor_type VARCHAR(20),
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_type VARCHAR(30),
    scheduled_at TIMESTAMP,
    duration_minutes INT,
    location VARCHAR(500),
    meeting_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'scheduled',
    feedback TEXT,
    interviewer_id UUID,
    interviewer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_application_events_created_at ON application_events(created_at);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
