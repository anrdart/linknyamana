-- Migration 004: New tables for features #3, #8, #9, #10, #11, #12, #15, #17

-- Uptime history (#3/#4)
CREATE TABLE IF NOT EXISTS uptime_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_url TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uptime_domain ON uptime_history (domain_url, checked_at DESC);

-- SSL monitoring (#8) - add columns to domain_meta
ALTER TABLE domain_meta ADD COLUMN IF NOT EXISTS ssl_issuer TEXT;
ALTER TABLE domain_meta ADD COLUMN IF NOT EXISTS ssl_expiry_date DATE;
ALTER TABLE domain_meta ADD COLUMN IF NOT EXISTS ssl_checked_at TIMESTAMPTZ;

-- Deadline per domain (#17)
ALTER TABLE domain_meta ADD COLUMN IF NOT EXISTS deadline DATE;

-- Notification log (#10/#11)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_url TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_domain ON notification_log (domain_url, sent_at DESC);

-- Activity log (#12)
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

-- Custom checklist per domain (#15)
CREATE TABLE IF NOT EXISTS domain_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_url TEXT NOT NULL UNIQUE,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram config (#9)
CREATE TABLE IF NOT EXISTS telegram_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
