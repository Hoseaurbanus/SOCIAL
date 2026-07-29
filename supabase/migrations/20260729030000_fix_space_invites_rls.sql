-- Fix: Drop old space_invites policies that cause infinite recursion
-- and recreate with SECURITY DEFINER functions

-- 1. Drop old policies
DROP POLICY IF EXISTS "Members can view own invites" ON space_invites;
DROP POLICY IF EXISTS "Owner/admin can create invites" ON space_invites;
DROP POLICY IF EXISTS "Creator or owner/admin can revoke invites" ON space_invites;
DROP POLICY IF EXISTS "Owner/admin can delete invites" ON space_invites;
DROP POLICY IF EXISTS "Anyone can validate invite token" ON space_invites;

-- 2. Drop old functions if they exist
DROP FUNCTION IF EXISTS is_space_member(UUID);
DROP FUNCTION IF EXISTS is_space_admin(UUID);

-- 3. Create SECURITY DEFINER helper functions
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

-- 4. Recreate policies using SECURITY DEFINER functions
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
