-- =======================================================
-- TRAVELOPS - HARDEN KNOWLEDGE BASE RLS POLICIES
-- =======================================================
-- Mengganti policy yang terlalu permisif (FOR ALL TO public) 
-- dengan prinsip Least Privilege:
-- 1. Publik/anonim HANYA dapat membaca (SELECT)
-- 2. Staff terautentikasi (authenticated) memiliki akses penuh (CRUD)

-- 1. Hapus policy lama yang terlalu permisif
DROP POLICY IF EXISTS "Allow all access to travelops_dest_countries" ON travelops_dest_countries;
DROP POLICY IF EXISTS "Allow all access to travelops_dest_cities" ON travelops_dest_cities;
DROP POLICY IF EXISTS "Allow all access to travelops_dest_objects" ON travelops_dest_objects;
DROP POLICY IF EXISTS "Allow all access to travelops_tour_routes" ON travelops_tour_routes;

-- Hapus juga jika ada policy baru sebelumnya
DROP POLICY IF EXISTS "Allow public read access to travelops_dest_countries" ON travelops_dest_countries;
DROP POLICY IF EXISTS "Allow public read access to travelops_dest_cities" ON travelops_dest_cities;
DROP POLICY IF EXISTS "Allow public read access to travelops_dest_objects" ON travelops_dest_objects;
DROP POLICY IF EXISTS "Allow public read access to travelops_tour_routes" ON travelops_tour_routes;

DROP POLICY IF EXISTS "Allow authenticated full access to travelops_dest_countries" ON travelops_dest_countries;
DROP POLICY IF EXISTS "Allow authenticated full access to travelops_dest_cities" ON travelops_dest_cities;
DROP POLICY IF EXISTS "Allow authenticated full access to travelops_dest_objects" ON travelops_dest_objects;
DROP POLICY IF EXISTS "Allow authenticated full access to travelops_tour_routes" ON travelops_tour_routes;

-- 2. Kebijakan Read-Only untuk Publik (SELECT)
CREATE POLICY "Allow public read access to travelops_dest_countries" 
  ON travelops_dest_countries FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to travelops_dest_cities" 
  ON travelops_dest_cities FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to travelops_dest_objects" 
  ON travelops_dest_objects FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to travelops_tour_routes" 
  ON travelops_tour_routes FOR SELECT TO public USING (true);

-- 3. Kebijakan Penuh untuk Pengguna Terotentikasi (CRUD)
CREATE POLICY "Allow authenticated full access to travelops_dest_countries" 
  ON travelops_dest_countries FOR ALL TO authenticated 
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated full access to travelops_dest_cities" 
  ON travelops_dest_cities FOR ALL TO authenticated 
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated full access to travelops_dest_objects" 
  ON travelops_dest_objects FOR ALL TO authenticated 
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated full access to travelops_tour_routes" 
  ON travelops_tour_routes FOR ALL TO authenticated 
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
