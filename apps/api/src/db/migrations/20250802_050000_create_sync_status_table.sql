-- Migration: Create sync status table for data synchronization
-- Created: 2025-08-02
-- Description: Adds sync_status table to track synchronization state between mobile clients and server

-- Sync Status table (for tracking synchronization state)
CREATE TABLE sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_in_progress BOOLEAN NOT NULL DEFAULT false,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Add indexes for sync performance
CREATE INDEX idx_sync_status_user_device ON sync_status(user_id, device_id);
CREATE INDEX idx_sync_status_last_sync ON sync_status(last_sync);
CREATE INDEX idx_sync_status_in_progress ON sync_status(sync_in_progress) WHERE sync_in_progress = true;

-- Add updated_at trigger for sync_status
CREATE TRIGGER update_sync_status_updated_at 
  BEFORE UPDATE ON sync_status 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes to existing tables for better sync performance
CREATE INDEX IF NOT EXISTS idx_financial_accounts_updated ON financial_accounts(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_financial_goals_updated ON financial_goals(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_scenarios_updated ON scenarios(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_account_transactions_updated ON account_transactions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_goal_progress_updated ON goal_progress(user_id, updated_at);

-- Add synced_at column to track when records were last synced
ALTER TABLE financial_accounts ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE financial_goals ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE goal_progress ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Create indexes on synced_at columns
CREATE INDEX IF NOT EXISTS idx_financial_accounts_synced ON financial_accounts(synced_at);
CREATE INDEX IF NOT EXISTS idx_financial_goals_synced ON financial_goals(synced_at);
CREATE INDEX IF NOT EXISTS idx_scenarios_synced ON scenarios(synced_at);
CREATE INDEX IF NOT EXISTS idx_account_transactions_synced ON account_transactions(synced_at);
CREATE INDEX IF NOT EXISTS idx_goal_progress_synced ON goal_progress(synced_at);
