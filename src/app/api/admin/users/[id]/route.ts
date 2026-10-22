import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateAdmin } from '@/lib/admin-auth';
import { UserRepository } from '@/repositories/user.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey, SystemRole } from '@/types';
import { NotFoundError, ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const UserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  roles: z.array(z.nativeEnum(SystemRole)).min(1, 'At least one role is required').optional(),
});

/**
 * Activates/deactivates an account or changes its roles. Admin authorization
 * re-reads these from the database on every request, so changes take effect
 * immediately (no waiting for a 7-day token to expire).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_USERS);
    const json = await req.json();
    const payload = UserUpdateSchema.parse(json);

    if (payload.isActive === undefined && payload.roles === undefined) {
      throw new ValidationError('Provide isActive and/or roles to update.');
    }

    const target = await UserRepository.findById(params.id);
    if (!target) throw new NotFoundError('User');

    // Lockout guards: an admin cannot deactivate or demote themselves.
    if (params.id === admin.userId) {
      if (payload.isActive === false) {
        throw new ValidationError('You cannot deactivate your own account.');
      }
      if (
        payload.roles &&
        target.roles?.includes(SystemRole.SUPER_ADMIN) &&
        !payload.roles.includes(SystemRole.SUPER_ADMIN)
      ) {
        throw new ValidationError('You cannot remove your own SUPER_ADMIN role.');
      }
    }

    const updated = await UserRepository.update(params.id, {
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.roles ? { roles: payload.roles } : {}),
    });
    if (!updated) throw new NotFoundError('User');

    await AuditRepository.log(
      'USER_UPDATED',
      'User',
      params.id,
      admin.userId,
      admin.email,
      { isActive: target.isActive, roles: target.roles },
      { isActive: updated.isActive, roles: updated.roles }
    );

    const { passwordHash: _passwordHash, ...safeUser } = updated;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
