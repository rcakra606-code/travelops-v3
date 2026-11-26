-- Create & seed travelops_cruise_guides table for Cruise Sales Guide (/cruise-guide)
CREATE TABLE IF NOT EXISTS public.travelops_cruise_guides (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  segment TEXT NOT NULL DEFAULT 'Family',
  budget_tier INTEGER NOT NULL DEFAULT 3 CHECK (budget_tier BETWEEN 1 AND 5),
  featured_ships JSONB NOT NULL DEFAULT '[]'::jsonb,
  homeports JSONB NOT NULL DEFAULT '[]'::jsonb,
  regions JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
  halal_status TEXT NOT NULL DEFAULT 'Pre-Order Halal',
  halal_notes TEXT NOT NULL DEFAULT '',
  gratuity_currency TEXT NOT NULL DEFAULT 'USD',
  gratuity_standard NUMERIC(10, 2) NOT NULL DEFAULT 0,
  gratuity_suite NUMERIC(10, 2) NOT NULL DEFAULT 0,
  gratuity_notes TEXT NOT NULL DEFAULT '',
  min_infant_months INTEGER NOT NULL DEFAULT 6,
  pregnancy_max_weeks INTEGER NOT NULL DEFAULT 23,
  min_booking_age INTEGER NOT NULL DEFAULT 18,
  vip_club_name TEXT NOT NULL DEFAULT '',
  typical_durations JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  sales_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  dress_code TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#0ea5e9',
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by TEXT NOT NULL DEFAULT 'System Seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.travelops_cruise_guides IS 'Curated & admin-editable cruise line sales reference guide for TravelOps consultants.';

CREATE INDEX IF NOT EXISTS idx_travelops_cruise_guides_sort
  ON public.travelops_cruise_guides (sort_order, brand_name);

ALTER TABLE public.travelops_cruise_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to travelops_cruise_guides" ON public.travelops_cruise_guides;
CREATE POLICY "Allow authenticated full access to travelops_cruise_guides"
  ON public.travelops_cruise_guides
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
