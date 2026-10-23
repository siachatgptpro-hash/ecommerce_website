// ==============================================================================
// AUTHENTICATION & RBAC SERVICE — SHLOKVEDA
// ==============================================================================

import { UserRepository } from '@/repositories/user.repository';
import { PermissionKey, SystemRole, User } from '@/types';
import { AuthenticationError, AuthorizationError, ConflictError } from '@/lib/errors';
import { hasAdminRole } from '@/lib/admin-roles';
import type { SessionScope, SessionTokenScope } from '@/lib/session';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const globalForAuth = globalThis as typeof globalThis & { shlokvedaRuntimeAuthSecret?: string };

// In development a per-process secret is convenient, but in production it
// would silently differ between server instances (random logouts / 401s on
// serverless). Production MUST configure a stable AUTH_SECRET. The check is
// lazy (on first token use) so builds don't fail where env vars are only
// injected at runtime.
const USING_EPHEMERAL_SECRET = !process.env.AUTH_SECRET;
const JWT_SECRET = process.env.AUTH_SECRET || (globalForAuth.shlokvedaRuntimeAuthSecret ??= crypto.randomBytes(32).toString('hex'));
const TOKEN_EXPIRY = '7d';
// Compared against when an identifier does not exist, so missing-account and
// wrong-password attempts take a similar path and do not reveal which part
// was wrong through response timing. This is only a bcrypt hash, not a login.
const DUMMY_PASSWORD_HASH = '$2a$12$zR9cQaXVcp7c88vSkQVg/.z/BAPsKuS12P9IotrZG6JuAETTetsfW';

function assertProductionSecret(): void {
  if (USING_EPHEMERAL_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET environment variable is required in production. Set a long random value in your deployment settings.');
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  roles: SystemRole[];
  permissions: PermissionKey[];
  scope?: SessionTokenScope;
}

export interface VerifyTokenOptions {
  scope?: SessionScope;
  allowLegacyScope?: boolean;
}

export class AuthService {
  public static async register(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string; scope: 'customer' }> {
    const existingEmail = await UserRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('An account with this email address already exists');
    }

    if (data.phone) {
      const existingPhone = await UserRepository.findByPhone(data.phone);
      if (existingPhone) {
        throw new ConflictError('An account with this mobile number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    let user;
    try {
      user = await UserRepository.create({
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        passwordHash,
        isActive: true,
        isVerified: false,
        roles: [SystemRole.CUSTOMER],
        permissions: [],
      });
    } catch (error: any) {
      // Lost a race against a parallel registration with the same email/phone:
      // report a clean conflict instead of a raw database 500.
      if (error?.code === '23505') {
        throw new ConflictError('An account with this email address or mobile number already exists');
      }
      throw error;
    }

    const token = this.generateToken(user, 'customer');
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token, scope: 'customer' as const };
  }

  public static async login(
    emailOrPhone: string,
    password: string,
    scope: SessionTokenScope = 'legacy'
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string; scope: SessionTokenScope }> {
    const user = await UserRepository.findByEmailOrPhone(emailOrPhone);

    let isValid = false;
    try {
      // The async API keeps a deliberately expensive bcrypt check from
      // blocking every other request handled by the same server instance.
      isValid = await bcrypt.compare(password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    } catch {
      isValid = false;
    }

    if (!user || !isValid) {
      throw new AuthenticationError('Invalid email/mobile or password');
    }

    if (!user.isActive) {
      throw new AuthorizationError('Your account has been deactivated. Please contact support.');
    }

    if (scope === 'admin' && !hasAdminRole(user.roles)) {
      throw new AuthorizationError(
        'This account does not have admin access. Please sign in with an administrator account.',
        'ADMIN_ROLE_REQUIRED'
      );
    }

    const token = this.generateToken(user, scope);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token, scope };
  }

  public static generateToken(
    user: User | Omit<User, 'passwordHash'>,
    scope: SessionTokenScope = 'legacy'
  ): string {
    assertProductionSecret();
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles || [SystemRole.CUSTOMER],
      permissions: user.permissions || [],
      scope,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' });
  }

  public static verifyToken(
    token: string,
    options: VerifyTokenOptions | SessionScope = {}
  ): TokenPayload {
    assertProductionSecret();
    const resolvedOptions: VerifyTokenOptions =
      typeof options === 'string' ? { scope: options } : options;

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired authentication session. Please log in.');
    }

    if (resolvedOptions.scope) {
      const hasLegacyScope = !payload.scope || payload.scope === 'legacy';
      const scopeMatches = payload.scope === resolvedOptions.scope;
      const legacyAllowed = hasLegacyScope && resolvedOptions.allowLegacyScope !== false;
      if (!scopeMatches && !legacyAllowed) {
        throw new AuthenticationError(
          resolvedOptions.scope === 'admin'
            ? 'Please sign in to the admin panel again.'
            : 'Please sign in to your customer account again.',
          'SESSION_SCOPE_MISMATCH'
        );
      }
    }

    return payload;
  }

  public static async getCurrentUser(
    token: string,
    options: VerifyTokenOptions | SessionScope = {}
  ): Promise<Omit<User, 'passwordHash'>> {
    const payload = this.verifyToken(token, options);
    const user = await UserRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User session is invalid');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public static requirePermission(payload: TokenPayload, permission: PermissionKey): void {
    if (payload.roles.includes(SystemRole.SUPER_ADMIN)) {
      return; // Super admin has global bypass
    }
    if (!payload.permissions.includes(permission)) {
      throw new AuthorizationError(
        `Missing required permission: ${permission}`,
        'ADMIN_PERMISSION_REQUIRED',
        { permission }
      );
    }
  }

  public static requireRole(payload: TokenPayload, allowedRoles: SystemRole[]): void {
    if (payload.roles.includes(SystemRole.SUPER_ADMIN)) {
      return;
    }
    const hasRole = payload.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new AuthorizationError(
        'You do not have access to this operational module',
        'ADMIN_ROLE_REQUIRED'
      );
    }
  }

  public register(data: any) { return AuthService.register(data); }
  public login(emailOrPhone: string, password: string, scope?: SessionTokenScope) {
    return AuthService.login(emailOrPhone, password, scope);
  }
  public generateToken(user: any, scope?: SessionTokenScope) {
    return AuthService.generateToken(user, scope);
  }
  public verifyToken(token: string, options?: VerifyTokenOptions | SessionScope) {
    return AuthService.verifyToken(token, options);
  }
  public getCurrentUser(token: string, options?: VerifyTokenOptions | SessionScope) {
    return AuthService.getCurrentUser(token, options);
  }
  public requirePermission(payload: any, perm: any) { return AuthService.requirePermission(payload, perm); }
  public requireRole(payload: any, roles: any) { return AuthService.requireRole(payload, roles); }
}

export const authService = new AuthService();
