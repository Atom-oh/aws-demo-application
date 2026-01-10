-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobseeker profiles table
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

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    business_number VARCHAR(20) UNIQUE,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    location VARCHAR(200),
    logo_url VARCHAR(500),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company members table
CREATE TABLE company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100),
    position VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_jobseeker_profiles_user_id ON jobseeker_profiles(user_id);
CREATE INDEX idx_jobseeker_profiles_skills ON jobseeker_profiles USING GIN(skills);
CREATE INDEX idx_jobseeker_profiles_experience ON jobseeker_profiles(experience_years);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_status ON companies(status);

CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_is_primary ON company_members(is_primary);
