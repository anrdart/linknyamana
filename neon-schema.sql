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
  domain_url TEXT NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, domain_url)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_domain_progress_domain_url ON domain_progress (domain_url);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Domain status cache table (shared across all users)
CREATE TABLE IF NOT EXISTS domain_status (
  domain_url TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'checking',
  detected_cms TEXT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_status_url ON domain_status (domain_url);
CREATE INDEX IF NOT EXISTS idx_domain_status_checked ON domain_status (checked_at);

-- Domain meta table for tracking domain registration info, expiry, and notifications
CREATE TABLE IF NOT EXISTS domain_meta (
  domain_url TEXT PRIMARY KEY,
  registration_date DATE NULL,
  expiry_date DATE NULL,
  email_notify BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_meta_expiry_date ON domain_meta (expiry_date);

-- Custom categories (added by staffwebdev via UI)
CREATE TABLE IF NOT EXISTS custom_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📌',
  owner TEXT NOT NULL DEFAULT 'staffwebdev',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, owner)
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_owner ON custom_categories (owner);

-- Custom domains (added by staffwebdev via UI)
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category_name TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'staffwebdev',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (url, owner)
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_owner ON custom_domains (owner);
CREATE INDEX IF NOT EXISTS idx_custom_domains_category ON custom_domains (category_name);

-- Seed default users
INSERT INTO users (username, display_name, password_hash, role) VALUES
  ('alul', 'Alul', '$2b$10$w7CkcM0/c535MHuLP9ALaOQukZAWOnNvyERSjSQhGp/zXQ/FmKlpK', 'editor'),
  ('dymas', 'Dymas', '$2b$10$w7CkcM0/c535MHuLP9ALaOQukZAWOnNvyERSjSQhGp/zXQ/FmKlpK', 'editor'),
  ('dilla', 'Dilla', '$2b$10$w7CkcM0/c535MHuLP9ALaOQukZAWOnNvyERSjSQhGp/zXQ/FmKlpK', 'editor'),
  ('staffwebdev', 'Staff Webdev', '$2b$10$DZWEZmA99YcmNCrUSWnZmewdSXjGZREvsqqTYVuyfh8CWYxMf08EG', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Clean expired sessions periodically
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Notification emails for domain expiry alerts (staffwebdev manages these)
CREATE TABLE IF NOT EXISTS notification_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-category assignments (replaces hardcoded userDomains mapping)
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(username, category_name)
);

-- Uptime history (per-check log)
CREATE TABLE IF NOT EXISTS uptime_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_url TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uptime_domain ON uptime_history (domain_url, checked_at DESC);

-- Notification log (cooldown & escalation tracking)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_url TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_domain ON notification_log (domain_url, sent_at DESC);

-- Activity log (audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log (created_at DESC);

-- Custom WordPress checklist per domain
CREATE TABLE IF NOT EXISTS domain_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_url TEXT NOT NULL UNIQUE,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram notification config
CREATE TABLE IF NOT EXISTS telegram_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
