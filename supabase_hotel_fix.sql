-- ==========================================
-- TRAVELOPS V4 - SUPABASE SCHEMA FIX
-- ==========================================
ALTER TABLE travelops_hotels
ADD COLUMN confirmation_number VARCHAR(100),
ADD COLUMN supplier_code VARCHAR(100),
ADD COLUMN supplier_name VARCHAR(255),
ADD COLUMN staff VARCHAR(255);
