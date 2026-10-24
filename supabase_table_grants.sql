-- =======================================================
-- TRAVELOPS - SUPABASE ROLE PERMISSIONS & GRANTS MIGRATION
-- =======================================================
-- Sesuai rekomendasi dan notifikasi keamanan resmi Supabase:
-- PostgREST Data API membutuhkan hak akses (GRANT) eksplisit 
-- pada schema public untuk role: anon, authenticated, dan service_role.
--
-- Instruksi: Copy seluruh teks ini dan Paste ke menu "SQL Editor" -> "New Query" 
-- di Supabase Dashboard Anda, lalu klik "Run".

-- 1. Berikan hak akses USAGE pada schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Hak akses pada seluruh sequence (untuk auto-increment / serial ID)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Konfigurasi hak akses (GRANT) untuk seluruh tabel di schema public:
--    - anon: SELECT (Read-only sesuai kebijakan RLS)
--    - authenticated: SELECT, INSERT, UPDATE, DELETE (Full CRUD untuk staff yang login)
--    - service_role: SELECT, INSERT, UPDATE, DELETE (Full CRUD untuk backend/admin)

DO $$ 
DECLARE 
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon;', tbl.table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', tbl.table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role;', tbl.table_name);
    END LOOP;
END $$;

-- 4. Set Default Privileges untuk tabel dan sequence masa depan
--    (Memastikan jika ada penambahan tabel baru, izin ini otomatis diterapkan)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
