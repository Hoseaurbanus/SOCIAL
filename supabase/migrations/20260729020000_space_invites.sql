-- Space Invites Migration
-- Adds: space_invites table, require_approval column, RLS policies, indexes

-- 1. Add require_approval column to spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false;

-- 2. Create space_invites table
CREATE TABLE IF NOT EXISTS space_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('direct', 'link')),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  invited_user_id UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_space_invites_space_id ON space_invites(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invites_token ON space_invites(token);
CREATE INDEX IF NOT EXISTS idx_space_invites_invited_user_id ON space_invites(invited_user_id);

-- 4. SECURITY DEFINER helper functions (avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_space_member(space_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = space_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_space_admin(space_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = space_uuid AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. RLS policies for space_invites (use SECURITY DEFINER functions)
ALTER TABLE space_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can validate a token (for join page)
CREATE POLICY "Anyone can validate invite token"
  ON space_invites FOR SELECT
  USING (true);

-- Creator or space admin can view invites
CREATE POLICY "Creator or admin can view invites"
  ON space_invites FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_space_admin(space_id)
  );

-- Space admin can create invites
CREATE POLICY "Admin can create invites"
  ON space_invites FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND is_space_admin(space_id)
  );

-- Creator or space admin can revoke
CREATE POLICY "Creator or admin can revoke invites"
  ON space_invites FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_space_admin(space_id)
  );

-- Space admin can delete invites
CREATE POLICY "Admin can delete invites"
  ON space_invites FOR DELETE
  USING (
    is_space_admin(space_id)
  );

-- 6. RPC function to increment invite usage
CREATE OR REPLACE FUNCTION increment_invite_usage(invite_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE space_invites
  SET used_count = used_count + 1
  WHERE token = invite_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC function to check if space requires approval
CREATE OR REPLACE FUNCTION space_requires_approval(space_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT require_approval INTO result
  FROM spaces WHERE id = space_uuid;
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
