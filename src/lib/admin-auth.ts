import { NextRequest } from 'next/server';
import { AuthService, TokenPayload } from '@/services/auth.service';
import { UserRepository } from '@/repositories/user.repository';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { ADMIN_ROLES } from '@/lib/admin-roles';
import { resolveRequestSessionToken } from '@/lib/session';
import { PermissionKey, SystemRole } from '@/types';

/**
 * Authenticates an admin API request using the admin-scoped browser session
 * (with the legacy cookie as a migration fallback).
 *
 * The JWT proves the caller logged in at some point, but roles, permissions
 * and account status are ALWAYS re-loaded from the database — a deactivated
 * or demoted admin loses access immediately instead of whenever their
 * 7-day token happens to expire.
 */
export async function authenticateAdmin(req: NextRequest, requiredPermission?: PermissionKey): Promise<TokenPayload> {
  const resolved = resolveRequestSessionToken(req, 'admin');

  if (!resolved) {
    throw new AuthenticationError('Admin authentication required.', 'ADMIN_SESSION_REQUIRED');
  }

  const tokenPayload = AuthService.verifyToken(resolved.token, { scope: 'admin' });

  const user = await UserRepository.findById(tokenPayload.userId);
  if (!user || !user.isActive) {
    throw new AuthenticationError('Admin session is no longer valid.', 'ADMIN_SESSION_REQUIRED');
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles || [SystemRole.CUSTOMER],
    permissions: user.permissions || [],
    scope: 'admin',
  };

  const isAdmin = payload.roles.some((r) => ADMIN_ROLES.includes(r));
  if (!isAdmin) {
    throw new AuthorizationError(
      'This account does not have admin access. Please sign in with an administrator account.',
      'ADMIN_ROLE_REQUIRED'
    );
  }

  if (requiredPermission) {
    AuthService.requirePermission(payload, requiredPermission);
  }

  return payload;
}

export const requireAdminPermission = authenticateAdmin;
export const requireAdmin = authenticateAdmin;
