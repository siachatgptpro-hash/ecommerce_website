import { NextRequest } from 'next/server';
import { AuthService, TokenPayload } from '@/services/auth.service';
import { UserRepository } from '@/repositories/user.repository';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { ADMIN_ROLES } from '@/lib/admin-page-auth';
import { PermissionKey, SystemRole } from '@/types';

/**
 * Authenticates an admin API request.
 *
 * The JWT proves the caller logged in at some point, but roles, permissions
 * and account status are ALWAYS re-loaded from the database — a deactivated
 * or demoted admin loses access immediately instead of whenever their
 * 7-day token happens to expire.
 */
export async function authenticateAdmin(req: NextRequest, requiredPermission?: PermissionKey): Promise<TokenPayload> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('shlokveda_session_token')?.value;

  if (!token) {
    throw new AuthenticationError('Admin authentication required.');
  }

  const tokenPayload = AuthService.verifyToken(token);

  const user = await UserRepository.findById(tokenPayload.userId);
  if (!user || !user.isActive) {
    throw new AuthenticationError('Admin session is no longer valid.');
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles || [SystemRole.CUSTOMER],
    permissions: user.permissions || [],
  };

  const isAdmin = payload.roles.some((r) => ADMIN_ROLES.includes(r));
  if (!isAdmin) {
    throw new AuthorizationError('Administrative privileges required.');
  }

  if (requiredPermission) {
    AuthService.requirePermission(payload, requiredPermission);
  }

  return payload;
}

export const requireAdminPermission = authenticateAdmin;
export const requireAdmin = authenticateAdmin;
