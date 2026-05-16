-- ==========================================
-- TRAVELOPS V4 - SUPABASE SCHEMA PART 2
-- ==========================================
-- Instruksi: Copy seluruh teks ini dan Paste ke SQL Editor di Supabase, lalu "Run" lagi.

-- 1. Create Sales Input Table
CREATE TABLE travelops_sales (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50),
  title VARCHAR(255),
  pic VARCHAR(255),
  date DATE,
  amount DECIMAL,
  pax_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Corporate Accounts Table
CREATE TABLE travelops_corporate_accounts (
  id VARCHAR(50) PRIMARY KEY,
  account_code VARCHAR(100),
  company_name VARCHAR(255),
  address TEXT,
  credit_limit DECIMAL,
  status VARCHAR(50),
  pic_name VARCHAR(255),
  pic_phone VARCHAR(50),
  pic_office_email VARCHAR(255),
  pic_personal_email VARCHAR(255),
  remarks TEXT,
  flight_fee JSONB,
  hotel_fee JSONB,
  airlines_code VARCHAR(100),
  detail_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Corporate Sales Table
CREATE TABLE travelops_corporate_sales (
  id VARCHAR(50) PRIMARY KEY,
  date VARCHAR(50),
  account_code VARCHAR(100),
  category VARCHAR(100),
  sales_amount DECIMAL,
  profit_amount DECIMAL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Overtime Table
CREATE TABLE travelops_overtimes (
  id VARCHAR(50) PRIMARY KEY,
  staff VARCHAR(255),
  event_name VARCHAR(255),
  date DATE,
  hours DECIMAL,
  status VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Productivity Table
CREATE TABLE travelops_productivity (
  id VARCHAR(50) PRIMARY KEY,
  date VARCHAR(50),
  staff VARCHAR(255),
  category VARCHAR(100),
  type VARCHAR(100),
  sales_amount DECIMAL,
  profit_amount DECIMAL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
