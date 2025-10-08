-- Migration: Talent Decline Job & Account Blacklist System
-- Description: Adds blacklisting, soft deletion, and scheduled purge functionality
-- Date: 2025-10-07

-- Add blacklist and soft deletion columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS soft_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

-- Create index for performance on blacklist queries
CREATE INDEX IF NOT EXISTS idx_users_blacklisted ON users(is_blacklisted) WHERE is_blacklisted = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_soft_deleted ON users(soft_deleted) WHERE soft_deleted = TRUE;

-- Account Purge Queue table for scheduled deletions
CREATE TABLE IF NOT EXISTS account_purge_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  enqueued_at TIMESTAMPTZ DEFAULT NOW(),
  purge_after TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ NULL,
  result TEXT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_user_purge UNIQUE(user_id, processed)
);

-- Create index for purge worker queries
CREATE INDEX IF NOT EXISTS idx_purge_queue_pending ON account_purge_queue(purge_after)
  WHERE processed = FALSE;

-- Admin Audit Log table for compliance and security
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- Add 'declined_by_talent' to booking_status enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'declined_by_talent'
        AND enumtypid = 'booking_status'::regtype
    ) THEN
        ALTER TYPE booking_status ADD VALUE 'declined_by_talent';
    END IF;
END $$;

-- Create function to audit account blacklisting
CREATE OR REPLACE FUNCTION audit_account_blacklist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_blacklisted = TRUE AND (OLD.is_blacklisted IS NULL OR OLD.is_blacklisted = FALSE) THEN
    INSERT INTO admin_audit_log (user_id, actor_id, action, payload)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.id), -- Use current user or self
      'account_blacklisted',
      jsonb_build_object(
        'reason', NEW.delete_reason,
        'soft_deleted', NEW.soft_deleted,
        'deleted_at', NEW.deleted_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS trigger_audit_blacklist ON users;
CREATE TRIGGER trigger_audit_blacklist
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.is_blacklisted = TRUE)
  EXECUTE FUNCTION audit_account_blacklist();

-- RLS Policies for account_purge_queue
ALTER TABLE account_purge_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access purge queue
CREATE POLICY "Service role full access to purge queue"
  ON account_purge_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role and admins can view audit logs
CREATE POLICY "Service role and admins can view audit logs"
  ON admin_audit_log
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Update photographers table to hide blacklisted accounts
CREATE OR REPLACE FUNCTION update_photographer_visibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.soft_deleted = TRUE OR NEW.is_blacklisted = TRUE THEN
    UPDATE photographers
    SET is_public = FALSE, visible_in_search = FALSE
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_hide_blacklisted_photographer ON users;
CREATE TRIGGER trigger_hide_blacklisted_photographer
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.soft_deleted = TRUE OR NEW.is_blacklisted = TRUE)
  EXECUTE FUNCTION update_photographer_visibility();

-- Add comments for documentation
COMMENT ON COLUMN users.is_blacklisted IS 'Immediately blocks account from login and public listings';
COMMENT ON COLUMN users.soft_deleted IS 'Marks account for deletion, hides from all searches';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when account was marked for deletion';
COMMENT ON COLUMN users.delete_reason IS 'Reason for account deletion (e.g., declined job, violation)';
COMMENT ON TABLE account_purge_queue IS 'Queue for scheduled permanent account deletions';
COMMENT ON TABLE admin_audit_log IS 'Immutable audit trail for admin actions and account changes';
