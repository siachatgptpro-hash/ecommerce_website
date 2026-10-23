import { Pool } from 'pg';
import crypto from 'node:crypto';

/**
 * Repairs/promotes an EXISTING account to administrator without changing its
 * password. This covers the common setup trap where the owner's email was
 * first registered as a normal customer, so admin:bootstrap refused it.
 *
 * Required private environment:
 *   DATABASE_URL=postgresql://…
 *   ADMIN_EMAIL=owner@example.com
 *   CONFIRM_PROMOTE_ADMIN=YES
 *
 * If that account was also deactivated, ADMIN_REACTIVATE=YES is additionally
 * required before this command will reactivate it.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const confirmed = process.env.CONFIRM_PROMOTE_ADMIN === 'YES';
  const reactivate = process.env.ADMIN_REACTIVATE === 'YES';

  if (!databaseUrl || !email) {
    throw new Error('Set DATABASE_URL and ADMIN_EMAIL in a private execution environment.');
  }
  if (!confirmed) {
    throw new Error('Refusing to promote an account without CONFIRM_PROMOTE_ADMIN=YES.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const userResult = await client.query(
      'SELECT "id", "email", "fullName", "isActive" FROM "User" WHERE LOWER("email")=$1 LIMIT 1 FOR UPDATE',
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      throw new Error(`No account exists for ${email}. Register it first or use npm run admin:bootstrap to create a new admin.`);
    }

    if (!user.isActive && !reactivate) {
      throw new Error('That account exists but is deactivated. Re-run with ADMIN_REACTIVATE=YES only if this is your owner account.');
    }

    if (!user.isActive) {
      await client.query(
        'UPDATE "User" SET "isActive"=TRUE, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1',
        [user.id]
      );
    }

    const roleIds: string[] = [];
    for (const role of ['SUPER_ADMIN', 'ADMIN']) {
      const generatedId = `role_${role.toLowerCase()}`;
      await client.query(
        'INSERT INTO "Role" ("id","name","description") VALUES ($1,$2::"SystemRole",$3) ON CONFLICT ("name") DO NOTHING',
        [generatedId, role, `${role.replace('_', ' ').toLowerCase()} access`]
      );
      const roleResult = await client.query(
        'SELECT "id" FROM "Role" WHERE "name"=$1::"SystemRole" LIMIT 1',
        [role]
      );
      const roleId = roleResult.rows[0]?.id as string | undefined;
      if (!roleId) throw new Error(`Could not create or load the ${role} role.`);
      roleIds.push(roleId);

      await client.query(
        'INSERT INTO "UserRole" ("id","userId","roleId","createdAt") VALUES ($1,$2,$3,CURRENT_TIMESTAMP) ON CONFLICT ("userId","roleId") DO NOTHING',
        [`ur_${crypto.randomUUID()}`, user.id, roleId]
      );
    }

    const permissions = await client.query(
      'SELECT unnest(enum_range(NULL::"PermissionKey"))::text AS permission'
    );
    for (const roleId of roleIds) {
      for (const row of permissions.rows) {
        await client.query(
          'INSERT INTO "RolePermission" ("id","roleId","permission") VALUES ($1,$2,$3::"PermissionKey") ON CONFLICT ("roleId","permission") DO NOTHING',
          [`rp_${crypto.randomUUID()}`, roleId, row.permission]
        );
      }
    }

    const verify = await client.query(
      `SELECT
         ARRAY(SELECT r."name"::text FROM "UserRole" ur JOIN "Role" r ON r."id"=ur."roleId" WHERE ur."userId"=$1 ORDER BY r."name"::text) AS roles,
         EXISTS(
           SELECT 1 FROM "UserRole" ur
           JOIN "RolePermission" rp ON rp."roleId"=ur."roleId"
           WHERE ur."userId"=$1 AND rp."permission"='MANAGE_CMS'::"PermissionKey"
         ) AS "hasManageCms"`,
      [user.id]
    );
    const roles = (verify.rows[0]?.roles || []) as string[];
    if (!roles.includes('SUPER_ADMIN') || !roles.includes('ADMIN') || !verify.rows[0]?.hasManageCms) {
      throw new Error('Promotion verification failed; no changes were committed.');
    }

    await client.query('COMMIT');
    transactionStarted = false;
    console.log(`Promoted ${user.email} to administrator. Roles: ${roles.join(', ')}. Blog permission MANAGE_CMS: yes. Password unchanged.`);
  } catch (error) {
    if (transactionStarted) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Administrator promotion failed.');
  process.exitCode = 1;
});
