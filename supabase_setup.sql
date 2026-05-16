-- ==========================================
-- TRAVELOPS V4 - SUPABASE POSTGRESQL SCHEMA
-- ==========================================
-- Instruksi: Copy seluruh teks ini dan Paste ke menu "SQL Editor" -> "New Query" di Supabase Anda, lalu klik "Run".

-- 1. Create Users Table
CREATE TABLE travelops_users (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'Staff',
  status VARCHAR(50) DEFAULT 'Active',
  is_locked BOOLEAN DEFAULT false,
  must_change_password BOOLEAN DEFAULT false,
  password_hash TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create System Logs Table
CREATE TABLE travelops_logs (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_name VARCHAR(255),
  role VARCHAR(50),
  action VARCHAR(255),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Tours Table
CREATE TABLE travelops_tours (
  id VARCHAR(50) PRIMARY KEY,
  country VARCHAR(255),
  category VARCHAR(50),
  departure_date DATE,
  return_date DATE,
  max_capacity INTEGER,
  status VARCHAR(50) DEFAULT 'Pending',
  financials JSONB,
  pax_info JSONB,
  internals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Cruises Table
CREATE TABLE travelops_cruises (
  id VARCHAR(50) PRIMARY KEY,
  pic_name VARCHAR(255),
  route VARCHAR(255),
  pax_count INTEGER,
  sailing_start DATE,
  sailing_end DATE,
  cruise_line VARCHAR(255),
  booking_ref VARCHAR(100),
  final_payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Hotels Table
CREATE TABLE travelops_hotels (
  id VARCHAR(50) PRIMARY KEY,
  hotel_name VARCHAR(255),
  guest_list TEXT,
  check_in DATE,
  check_out DATE,
  room_type VARCHAR(100),
  region VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Documents Table
CREATE TABLE travelops_documents (
  id VARCHAR(50) PRIMARY KEY,
  doc_type VARCHAR(50),
  guest_name VARCHAR(255),
  country VARCHAR(100),
  receive_date DATE,
  estimated_done DATE,
  send_date DATE,
  price DECIMAL,
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Telecoms Table
CREATE TABLE travelops_telecoms (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50),
  nama VARCHAR(255),
  region VARCHAR(100),
  no_telp VARCHAR(50),
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  jumlah_deposit DECIMAL,
  metode_deposit VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Cashouts Table
CREATE TABLE travelops_cashouts (
  id VARCHAR(50) PRIMARY KEY,
  staff_name VARCHAR(255),
  division VARCHAR(100),
  total_amount DECIMAL,
  request_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  needs_approval BOOLEAN DEFAULT true,
  request_items JSONB,
  approved_by VARCHAR(255),
  approve_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Settings Table (Key-Value Store)
CREATE TABLE travelops_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Insert Default Admin User
-- Password default: "admin123" (akan diganti sistem hashing nantinya)
INSERT INTO travelops_users (name, email, role, status, password_hash, must_change_password) 
VALUES ('Super Admin', 'admin@travelops.com', 'Admin', 'Active', 'admin123', true);

-- 11. Insert Default Settings
INSERT INTO travelops_settings (setting_key, setting_value)
VALUES ('global_preferences', '{"idleTimeout": 15, "currency": "IDR", "language": "en", "companyName": "TravelOps Inc.", "dateFormat": "YYYY-MM-DD"}'::jsonb);
