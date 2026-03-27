-- =============================================
-- Neon SQL Schema for LinkNyaMana Dashboard
-- Run this in your Neon SQL Editor (Neon Console)
-- =============================================

CREATE TABLE IF NOT EXISTS domain_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_name TEXT UNIQUE NOT NULL,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_progress_domain_name
ON domain_progress (domain_name);
