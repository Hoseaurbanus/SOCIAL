-- FIX: Remove SECURITY DEFINER functions that cause space_members recursion
-- Use simple policies only

-- 1. Drop old helper functions
DROP FUNCTION IF EXISTS is_space_member(UUID);
DROP FUNCTION IF EXISTS is_space_admin(UUID);

-- 2. Drop ALL space_invites policies
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'space_invites'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON space_invites';
  END LOOP;
END $$;

-- 3. Recreate simple policies (no SECURITY DEFINER, no subqueries)
CREATE POLICY "view_invites_anyone"
  ON space_invites FOR SELECT
  USING (true);

CREATE POLICY "insert_invites_creator"
  ON space_invites FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_invites_creator"
  ON space_invites FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "delete_invites_creator"
  ON space_invites FOR DELETE
  USING (created_by = auth.uid());
