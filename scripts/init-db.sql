-- HireHub Database Initialization Script
-- Creates separate databases for each service

-- Create databases for each service
CREATE DATABASE hirehub_users;
CREATE DATABASE hirehub_jobs;
CREATE DATABASE hirehub_resumes;
CREATE DATABASE hirehub_applies;
CREATE DATABASE hirehub_matches;
CREATE DATABASE hirehub_notifications;

-- Grant privileges to hirehub user
GRANT ALL PRIVILEGES ON DATABASE hirehub_users TO hirehub;
GRANT ALL PRIVILEGES ON DATABASE hirehub_jobs TO hirehub;
GRANT ALL PRIVILEGES ON DATABASE hirehub_resumes TO hirehub;
GRANT ALL PRIVILEGES ON DATABASE hirehub_applies TO hirehub;
GRANT ALL PRIVILEGES ON DATABASE hirehub_matches TO hirehub;
GRANT ALL PRIVILEGES ON DATABASE hirehub_notifications TO hirehub;

-- Enable UUID extension for all databases
\c hirehub_users
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c hirehub_jobs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c hirehub_resumes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c hirehub_applies
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c hirehub_matches
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c hirehub_notifications
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Switch back to main database
\c hirehub
