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
ALTER TABLE travelops_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_corporate_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_overtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelops_sales_targets ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES TO ALLOW ONLY AUTHENTICATED USERS
-- (This ensures that the anonymous key cannot read/write data unless logged in via Supabase Auth)

CREATE POLICY "Allow authenticated full access to users" ON travelops_users FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to logs" ON travelops_logs FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to tours" ON travelops_tours FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to cruises" ON travelops_cruises FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to hotels" ON travelops_hotels FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to documents" ON travelops_documents FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to telecoms" ON travelops_telecoms FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to cashouts" ON travelops_cashouts FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to settings" ON travelops_settings FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow public read access to settings" ON travelops_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to travelops_sales" ON travelops_sales FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to travelops_corporate_accounts" ON travelops_corporate_accounts FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to travelops_corporate_sales" ON travelops_corporate_sales FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to travelops_overtimes" ON travelops_overtimes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to travelops_productivity" ON travelops_productivity FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated full access to travelops_sales_targets" ON travelops_sales_targets FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 3. MIGRATION INSTRUCTIONS FOR THE SUPER ADMIN
-- Because we are moving to Supabase Auth, you MUST create your first user in the Supabase Dashboard:
-- 1. Go to Authentication -> Users -> Add User -> Create New User
-- 2. Enter email: admin@travelops.com
-- 3. Enter password: admin123 (or a stronger password)
-- 4. Make sure "Auto Confirm User" is checked, and click Create User.
