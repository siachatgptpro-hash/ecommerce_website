import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { SystemRole } from '@/types';

export const ADMIN_ROLES: SystemRole[] = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ADMIN,
  SystemRole.PRODUCT_MANAGER,
  SystemRole.ORDER_MANAGER,
  SystemRole.CONTENT_MANAGER,
];

export function hasAdminRole(roles?: SystemRole[] | null): boolean {
  return !!roles?.some((role) => ADMIN_ROLES.includes(role));
}

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
  const token = cookies().get('shlokveda_session_token')?.value;
  if (!token) {
    redirect('/admin/login');
  }

  let user: Awaited<ReturnType<typeof AuthService.getCurrentUser>> | null = null;
  try {
    user = await AuthService.getCurrentUser(token);
  } catch {
    user = null;
  }

  if (!user || !hasAdminRole(user.roles)) {
    redirect('/admin/login');
  }

  return user;
}
