-- Job Service Schema

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    job_type VARCHAR(50),
    experience_level VARCHAR(50),
    experience_min INT,
    experience_max INT,
    salary_min INT,
    salary_max INT,
    location VARCHAR(200),
    remote_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft',
    views_count INT DEFAULT 0,
    applies_count INT DEFAULT 0,
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill tags table
CREATE TABLE skill_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50)
);

-- Job-Skill mapping table (many-to-many)
CREATE TABLE job_skills (
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skill_tags(id),
    is_required BOOLEAN DEFAULT true,
    PRIMARY KEY (job_id, skill_id)
);

-- Indexes for performance
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_remote_type ON jobs(remote_type);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

CREATE INDEX idx_skill_tags_name ON skill_tags(name);
CREATE INDEX idx_skill_tags_category ON skill_tags(category);

CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);

-- Full text search index for job search
CREATE INDEX idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_jobs_description_search ON jobs USING gin(to_tsvector('english', COALESCE(description, '')));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
