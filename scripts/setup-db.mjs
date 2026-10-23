// One-time setup for a NEW (empty) Postgres database (e.g. a fresh Neon project).
// Runs prisma/neon-setup.sql: creates all tables and seeds the catalogue.
//
// Usage:
//   DATABASE_URL='postgresql://…?sslmode=require' npm run db:setup
//
// Safe by design: refuses to run if the tables already exist, so it can
// never wipe or double-seed a database. For an EXISTING (older) database,
// run the files in prisma/migrations/ instead — see DEPLOY.md.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is missing.');
  console.error('Run it like this (paste your Neon connection string):');
  console.error("  DATABASE_URL='postgresql://…' npm run db:setup");
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = readFileSync(path.join(root, 'prisma', 'neon-setup.sql'), 'utf8');

const { Client } = await import('pg');
const client = new Client({ connectionString, connectionTimeoutMillis: 15000 });

try {
  console.log('Connecting to database…');
  await client.connect();

  const check = await client.query(
    `SELECT to_regclass('public."Product"') IS NOT NULL AS exists`
  );
  if (check.rows[0]?.exists) {
    console.error('STOP: this database already has the shop tables (setup was already done).');
    console.error('Nothing was changed. To update an existing database, see DEPLOY.md (migrations).');
    process.exit(1);
  }

  console.log('Creating tables + adding catalogue… (10–30 seconds)');
  await client.query(sql);

  const count = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`
  );
  console.log(`DONE ✅ Database ready (${count.rows[0].n} tables created).`);
  console.log('Next step — create your admin login:');
  console.log("  DATABASE_URL='postgresql://…' ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='min-14-chars' npm run admin:bootstrap");
} catch (err) {
  console.error('ERROR: setup did not finish.');
  console.error(err instanceof Error ? err.message : String(err));
  console.error('Check that DATABASE_URL is the full Neon connection string (pooled, ends with ?sslmode=require).');
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
