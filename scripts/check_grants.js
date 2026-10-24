import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // Check all tables and their policies
    const res = await client.query(`
      SELECT tablename, policyname, roles::text, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.table(res.rows);

  } catch (err) {
    console.error('Error auditing DB:', err.message);
  } finally {
    await client.end();
  }
}

run();
