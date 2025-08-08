-- UP
CREATE TABLE IF NOT EXISTS family_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES family_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'member', 'child')),
  permissions JSONB NOT NULL DEFAULT '{}',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES users(id),
  UNIQUE(family_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_accounts_owner ON family_accounts (owner_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members (family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members (user_id);

-- DOWN
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS family_accounts;
