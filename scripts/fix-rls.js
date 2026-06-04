import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function fixRLS() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is missing.");
    return;
  }
  const { Client } = pg;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const tables = [
      'travelops_sales',
      'travelops_corporate_accounts',
      'travelops_corporate_sales',
      'travelops_overtimes',
      'travelops_productivity',
      'travelops_sales_targets'
    ];

    for (const tableName of tables) {
      console.log(`Enabling RLS for ${tableName}...`);
      // Enable RLS
      await client.query(`ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;`);
      
      // Create Policy
      try {
        await client.query(`
          CREATE POLICY "Allow authenticated full access to ${tableName}" 
          ON public."${tableName}" 
          FOR ALL TO authenticated 
          USING (true) WITH CHECK (true);
        `);
        console.log(`Policy created for ${tableName}.`);
      } catch (err) {
        if (err.code === '42710') { // duplicate_object
          console.log(`Policy already exists for ${tableName}.`);
        } else {
          console.error(`Failed to create policy for ${tableName}:`, err.message);
        }
      }
    }
    console.log('RLS fixed successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixRLS();
