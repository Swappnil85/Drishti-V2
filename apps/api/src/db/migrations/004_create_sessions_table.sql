-- Migration: Create sessions table for session management
-- Description: Creates the sessions table to track user sessions with refresh tokens

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at);

-- Create composite index for active sessions lookup
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, is_active, expires_at) 
WHERE is_active = true;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE sessions IS 'User sessions with refresh token tracking';
COMMENT ON COLUMN sessions.id IS 'Unique session identifier';
COMMENT ON COLUMN sessions.user_id IS 'Reference to the user who owns this session';
COMMENT ON COLUMN sessions.refresh_token_hash IS 'SHA-256 hash of the refresh token';
COMMENT ON COLUMN sessions.device_info IS 'Information about the device (optional)';
COMMENT ON COLUMN sessions.ip_address IS 'IP address from which the session was created';
COMMENT ON COLUMN sessions.user_agent IS 'User agent string from the client';
COMMENT ON COLUMN sessions.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN sessions.expires_at IS 'When the session expires';
COMMENT ON COLUMN sessions.last_activity_at IS 'Last time the session was used';
COMMENT ON COLUMN sessions.created_at IS 'When the session was created';
COMMENT ON COLUMN sessions.updated_at IS 'When the session was last updated';
