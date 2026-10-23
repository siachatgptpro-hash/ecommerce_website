import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MARKER = 'OPENING_STOCK_100_20261024';
const MIGRATION = '20261024_fill_brochure_opening_stock_100.sql';

interface StockSummary {
  total: number;
  at100: number;
  marked: number;
  minimum: number;
  maximum: number;
}

async function summarize(client: Client): Promise<StockSummary> {
  const result = await client.query(
    `SELECT
       COUNT(*)::int AS "total",
       COUNT(*) FILTER (WHERE "stockQuantity" = 100)::int AS "at100",
       COUNT(*) FILTER (
         WHERE EXISTS (
           SELECT 1
           FROM "InventoryLedger" l
           WHERE l."variantId" = v."id"
             AND l."referenceId" = $1
         )
       )::int AS "marked",
       COALESCE(MIN("stockQuantity"), 0)::int AS "minimum",
       COALESCE(MAX("stockQuantity"), 0)::int AS "maximum"
     FROM "ProductVariant" v
     WHERE starts_with(v."id", 'pdfv_')`,
    [MARKER]
  );
  const row = result.rows[0] || {};
  return {
    total: Number(row.total || 0),
    at100: Number(row.at100 || 0),
    marked: Number(row.marked || 0),
    minimum: Number(row.minimum || 0),
    maximum: Number(row.maximum || 0),
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const confirmed = process.env.CONFIRM_FILL_BROCHURE_STOCK_100 === 'YES';

  if (!databaseUrl) {
    throw new Error('Set DATABASE_URL in a private execution environment.');
  }
  if (!confirmed) {
    throw new Error('Refusing to change stock without CONFIRM_FILL_BROCHURE_STOCK_100=YES.');
  }

  const migrationPath = path.resolve(process.cwd(), 'prisma', 'migrations', MIGRATION);
  let sql: string;
  try {
    sql = await readFile(migrationPath, 'utf8');
  } catch {
    throw new Error(`Could not find ${MIGRATION}. Run this command from the repository root after pulling the latest code.`);
  }

  const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 15_000 });

  try {
    await client.connect();

    const tables = await client.query(
      `SELECT
         to_regclass('public."ProductVariant"') IS NOT NULL AS "hasVariants",
         to_regclass('public."InventoryLedger"') IS NOT NULL AS "hasLedger"`
    );
    if (!tables.rows[0]?.hasVariants || !tables.rows[0]?.hasLedger) {
      throw new Error('The shop inventory tables were not found. Run the normal database setup/migrations first; do not rerun setup on an existing database.');
    }

    const before = await summarize(client);
    if (before.total === 0) {
      throw new Error('No brochure pack variants (IDs beginning with pdfv_) were found. Nothing was changed.');
    }

    console.log(
      `Before: ${before.total} brochure variants; ${before.at100} already at 100; ` +
      `${before.marked} already have the opening-stock ledger marker; stock range ${before.minimum}-${before.maximum}.`
    );

    if (before.marked === before.total) {
      console.log('Opening stock was already applied. Current balances were preserved; nothing was reset.');
      return;
    }

    const expectedChanges = before.total - before.marked;
    try {
      await client.query(sql);
    } catch (error) {
      // If the migration failed before its COMMIT, close its transaction so
      // the connection exits cleanly. If it had already committed, Postgres
      // simply reports that no transaction is active.
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }

    const after = await summarize(client);
    if (after.marked !== after.total) {
      throw new Error(`Verification failed: only ${after.marked} of ${after.total} brochure variants have the opening-stock ledger marker.`);
    }
    if (after.at100 !== after.total) {
      throw new Error(
        `Opening-stock markers are present, but only ${after.at100} of ${after.total} variants are currently at 100. ` +
        'Check for a sale/manual adjustment that happened at the same time before using these balances.'
      );
    }

    console.log(
      `Success: set ${expectedChanges} brochure pack variant(s) to 100 units. ` +
      `Verified ${after.at100}/${after.total} at 100 with ${after.marked} opening-stock ledger rows.`
    );
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Brochure stock fill failed.');
  process.exitCode = 1;
});
