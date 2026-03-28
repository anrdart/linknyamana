-- =============================================
-- Neon SQL Schema for LinkNyaMana Dashboard
-- Run this in your Neon SQL Editor (Neon Console)
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domain progress table (per-user)
CREATE TABLE IF NOT EXISTS domain_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, domain_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_domain_progress_domain_name ON domain_progress (domain_name);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Domain status cache table (shared across all users)
CREATE TABLE IF NOT EXISTS domain_status (
  domain_url TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'checking',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_status_url ON domain_status (domain_url);
CREATE INDEX IF NOT EXISTS idx_domain_status_checked ON domain_status (checked_at);

-- Seed default users
INSERT INTO users (username, display_name, password_hash, role) VALUES
  ('alul', 'Alul', '$2b$10$w7CkcM0/c535MHuLP9ALaOQukZAWOnNvyERSjSQhGp/zXQ/FmKlpK', 'admin'),
  ('dymas', 'Dymas', '$2b$10$w7CkcM0/c535MHuLP9ALaOQukZAWOnNvyERSjSQhGp/zXQ/FmKlpK', 'user'),
  ('dilla', 'Dilla', '$2b$10$w7CkcM0/c535MHuLP9ALaOQukZAWOnNvyERSjSQhGp/zXQ/FmKlpK', 'user'),
  ('staffwebdev', 'Staff Webdev', '$2b$10$DZWEZmA99YcmNCrUSWnZmewdSXjGZREvsqqTYVuyfh8CWYxMf08EG', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Clean expired sessions periodically
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
