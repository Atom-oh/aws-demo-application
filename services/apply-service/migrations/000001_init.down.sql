-- Drop indexes
DROP INDEX IF EXISTS idx_interviews_status;
DROP INDEX IF EXISTS idx_interviews_scheduled_at;
DROP INDEX IF EXISTS idx_interviews_application_id;
DROP INDEX IF EXISTS idx_application_events_created_at;
DROP INDEX IF EXISTS idx_application_events_application_id;
DROP INDEX IF EXISTS idx_applications_applied_at;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_user_id;
DROP INDEX IF EXISTS idx_applications_job_id;

-- Drop tables
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS application_events;
DROP TABLE IF EXISTS applications;
