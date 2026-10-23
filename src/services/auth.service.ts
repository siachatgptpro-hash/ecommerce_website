// ==============================================================================
// AUTHENTICATION & RBAC SERVICE — SHLOKVEDA
// ==============================================================================

import { UserRepository } from '@/repositories/user.repository';
import { PermissionKey, SystemRole, User } from '@/types';
import { AuthenticationError, AuthorizationError, ConflictError, ValidationError } from '@/lib/errors';
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
}

export class AuthService {
  public static async register(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
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

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);

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

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static async login(
    emailOrPhone: string,
    password: string
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = await UserRepository.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new AuthenticationError('Invalid email/mobile or password');
    }

    if (!user.isActive) {
      throw new AuthorizationError('Your account has been deactivated. Please contact support.');
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email/mobile or password');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static generateToken(user: User): string {
    assertProductionSecret();
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles || [SystemRole.CUSTOMER],
      permissions: user.permissions || [],
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' });
  }

  public static verifyToken(token: string): TokenPayload {
    assertProductionSecret();
    try {
      return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired authentication session. Please log in.');
    }
  }

  public static async getCurrentUser(token: string): Promise<Omit<User, 'passwordHash'>> {
    const payload = this.verifyToken(token);
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
      throw new AuthorizationError(`Missing required permission: ${permission}`);
    }
  }

  public static requireRole(payload: TokenPayload, allowedRoles: SystemRole[]): void {
    if (payload.roles.includes(SystemRole.SUPER_ADMIN)) {
      return;
    }
    const hasRole = payload.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new AuthorizationError('You do not have access to this operational module');
    }
  }

  public register(data: any) { return AuthService.register(data); }
  public login(emailOrPhone: string, password: string) { return AuthService.login(emailOrPhone, password); }
  public generateToken(user: any) { return AuthService.generateToken(user); }
  public verifyToken(token: string) { return AuthService.verifyToken(token); }
  public getCurrentUser(token: string) { return AuthService.getCurrentUser(token); }
  public requirePermission(payload: any, perm: any) { return AuthService.requirePermission(payload, perm); }
  public requireRole(payload: any, roles: any) { return AuthService.requireRole(payload, roles); }
}

export const authService = new AuthService();
