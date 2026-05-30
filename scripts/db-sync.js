import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../schema.config.json');

export async function syncDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ Warning: DATABASE_URL is not set in your .env file.");
    console.warn("Skipping automatic schema synchronization.");
    return;
  }

  const { Client } = pg;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Auto-Schema Sync: Connected to Supabase PostgreSQL.");

    const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const tables = schemaData.tables;

    for (const [tableName, columns] of Object.entries(tables)) {
      // Check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);

      if (!tableCheck.rows[0].exists) {
        console.log(`⚠️ Auto-Schema Sync: Table ${tableName} missing. Creating it now...`);
        let colsDef = [];
        for (const [colName, colType] of Object.entries(columns)) {
          colsDef.push(`"${colName}" ${colType}`);
        }
        const createQuery = `CREATE TABLE public."${tableName}" (${colsDef.join(', ')});`;
        await client.query(createQuery);
        
        // Enable RLS
        await client.query(`ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;`);
        await client.query(`CREATE POLICY "Allow authenticated full access to ${tableName}" ON public."${tableName}" FOR ALL TO authenticated USING (true) WITH CHECK (true);`);
        
        console.log(`✅ Auto-Schema Sync: Table ${tableName} created successfully!`);
      } else {
        // Table exists, check columns
        const colCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1;
        `, [tableName]);
        
        const existingCols = colCheck.rows.map(r => r.column_name);
        let addedCols = 0;
        
        for (const [colName, colType] of Object.entries(columns)) {
          if (!existingCols.includes(colName)) {
            try {
              await client.query(`ALTER TABLE public."${tableName}" ADD COLUMN "${colName}" ${colType};`);
              console.log(`✅ Auto-Schema Sync: Added missing column "${colName}" to ${tableName}.`);
              addedCols++;
            } catch (err) {
              console.error(`❌ Auto-Schema Sync: Failed to add column "${colName}": ${err.message}`);
            }
          }
        }
        if (addedCols > 0) {
          console.log(`✅ Auto-Schema Sync: Table ${tableName} updated.`);
        }
      }
    }
    
    console.log("🎉 Auto-Schema Sync: Database schema is up to date!");
  } catch (error) {
    console.error("❌ Auto-Schema Sync failed:", error.message);
  } finally {
    await client.end();
  }
}

// Allow running manually via node scripts/db-sync.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncDatabase();
}
