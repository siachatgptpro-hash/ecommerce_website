import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { ADMIN_ROLES, hasAdminRole } from '@/lib/admin-roles';
import { resolveCookieSessionToken } from '@/lib/session';

export { ADMIN_ROLES, hasAdminRole };

/**
 * Server-side guard for admin *pages* (Server Components).
 *
 * Client-side gates are not sufficient for Server Components: Next.js renders
 * the page on the server and ships the result (including fetched data) in the
 * RSC payload before any client check runs. Every admin Server Component must
 * call this before loading data. It re-loads the user from the database, so
 * deactivated accounts and revoked roles take effect immediately.
 */
export async function requireAdminPage() {
  const resolved = resolveCookieSessionToken(cookies(), 'admin');
  if (!resolved) {
    redirect('/admin/login');
  }

  let user: Awaited<ReturnType<typeof AuthService.getCurrentUser>> | null = null;
  try {
    user = await AuthService.getCurrentUser(resolved.token, { scope: 'admin' });
  } catch {
    user = null;
  }

  if (!user || !hasAdminRole(user.roles)) {
    redirect('/admin/login');
  }

  return user;
}
