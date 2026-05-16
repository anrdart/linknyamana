-- Migration 001: Rename whatsapp_notify to email_notify
-- The field was always used for email notifications, not WhatsApp
ALTER TABLE domain_meta RENAME COLUMN whatsapp_notify TO email_notify;
