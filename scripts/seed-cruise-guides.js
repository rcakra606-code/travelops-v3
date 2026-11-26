import pg from 'pg';
import dotenv from 'dotenv';
import { SEED_CRUISE_GUIDES } from '../src/utils/cruiseSalesGuideData.js';
import { toCruiseGuideDbPayload } from '../src/utils/cruiseSalesGuideHelpers.js';

dotenv.config();

async function seedCruiseGuides() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000
  });

  try {
    await client.connect();
    let totalShips = 0;

    for (const guide of SEED_CRUISE_GUIDES) {
      const row = toCruiseGuideDbPayload(guide, 'System Fleet Sync 2026');
      totalShips += row.featured_ships.length;

      await client.query(
        `
        INSERT INTO public.travelops_cruise_guides (
          id, brand_name, tagline, segment, budget_tier, featured_ships, homeports, regions,
          target_profiles, halal_status, halal_notes, gratuity_currency, gratuity_standard,
          gratuity_suite, gratuity_notes, min_infant_months, pregnancy_max_weeks, min_booking_age,
          vip_club_name, typical_durations, highlights, inclusions, sales_tips, dress_code,
          website_url, accent_color, sort_order, is_active, updated_by, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,
          $9::jsonb,$10,$11,$12,$13,
          $14,$15,$16,$17,$18,
          $19,$20::jsonb,$21::jsonb,$22::jsonb,$23::jsonb,$24,
          $25,$26,$27,$28,$29,$30
        )
        ON CONFLICT (id) DO UPDATE SET
          featured_ships = EXCLUDED.featured_ships,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at;
        `,
        [
          row.id,
          row.brand_name,
          row.tagline,
          row.segment,
          row.budget_tier,
          JSON.stringify(row.featured_ships),
          JSON.stringify(row.homeports),
          JSON.stringify(row.regions),
          JSON.stringify(row.target_profiles),
          row.halal_status,
          row.halal_notes,
          row.gratuity_currency,
          row.gratuity_standard,
          row.gratuity_suite,
          row.gratuity_notes,
          row.min_infant_months,
          row.pregnancy_max_weeks,
          row.min_booking_age,
          row.vip_club_name,
          JSON.stringify(row.typical_durations),
          JSON.stringify(row.highlights),
          JSON.stringify(row.inclusions),
          JSON.stringify(row.sales_tips),
          row.dress_code,
          row.website_url,
          row.accent_color,
          row.sort_order,
          row.is_active,
          row.updated_by,
          row.updated_at
        ]
      );
    }

    const verifyRes = await client.query(`
      SELECT
        COUNT(*) AS brand_count,
        SUM(jsonb_array_length(featured_ships)) AS total_ships
      FROM public.travelops_cruise_guides;
    `);
    console.log(
      `✅ Synced ${SEED_CRUISE_GUIDES.length} brands (${totalShips} ships). Live DB totals:`,
      verifyRes.rows[0]
    );
  } finally {
    await client.end();
  }
}

seedCruiseGuides().catch((err) => {
  console.error('❌ Cruise fleet seed failed:', err.message);
  process.exit(1);
});
