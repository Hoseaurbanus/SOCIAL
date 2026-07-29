-- COMPLETE FIX: Drop ALL old space_invites policies and recreate with SECURITY DEFINER

-- 1. Drop ALL existing policies on space_invites
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'space_invites'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON space_invites';
  END LOOP;
END $$;

-- 2. Drop old helper functions
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

-- 4. Recreate policies
CREATE POLICY "view_invites_public"
  ON space_invites FOR SELECT
  USING (true);

CREATE POLICY "view_invites_creator_or_admin"
  ON space_invites FOR SELECT
  USING (created_by = auth.uid() OR is_space_admin(space_id));

CREATE POLICY "insert_invites_admin"
  ON space_invites FOR INSERT
  WITH CHECK (created_by = auth.uid() AND is_space_admin(space_id));

CREATE POLICY "update_invites_creator_or_admin"
  ON space_invites FOR UPDATE
  USING (created_by = auth.uid() OR is_space_admin(space_id));

CREATE POLICY "delete_invites_admin"
  ON space_invites FOR DELETE
  USING (is_space_admin(space_id));
