-- Migration 002: Change domain_progress key from domain_name to domain_url
-- Also fixes multi-user bug: API now filters by user_id

ALTER TABLE domain_progress ADD COLUMN IF NOT EXISTS domain_url TEXT;

-- Drop old constraint
ALTER TABLE domain_progress DROP CONSTRAINT IF EXISTS domain_progress_user_id_domain_name_key;

-- Add new unique constraint
ALTER TABLE domain_progress ADD CONSTRAINT domain_progress_user_id_domain_url_key UNIQUE (user_id, domain_url);
