-- ==========================================
-- TRAVELOPS V4 - SUPABASE RLS & AUTH MIGRATION
-- ==========================================

-- 1. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
ALTER TABLE travelops_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_cruises ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_telecoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_cashouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_settings ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES TO ALLOW ONLY AUTHENTICATED USERS
-- (This ensures that the anonymous key cannot read/write data unless logged in via Supabase Auth)

CREATE POLICY "Allow authenticated full access to users" ON travelops_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to logs" ON travelops_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to tours" ON travelops_tours FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to cruises" ON travelops_cruises FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to hotels" ON travelops_hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to documents" ON travelops_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to telecoms" ON travelops_telecoms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to cashouts" ON travelops_cashouts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to settings" ON travelops_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. MIGRATION INSTRUCTIONS FOR THE SUPER ADMIN
-- Because we are moving to Supabase Auth, you MUST create your first user in the Supabase Dashboard:
-- 1. Go to Authentication -> Users -> Add User -> Create New User
-- 2. Enter email: admin@travelops.com
-- 3. Enter password: admin123 (or a stronger password)
-- 4. Make sure "Auto Confirm User" is checked, and click Create User.
