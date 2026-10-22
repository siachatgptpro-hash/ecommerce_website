import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { UserRepository } from '@/repositories/user.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, PermissionKey.MANAGE_USERS);
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 200));

    let users = await UserRepository.listAll();
    if (search) {
      users = users.filter(
        (user) =>
          user.email.toLowerCase().includes(search) ||
          user.fullName.toLowerCase().includes(search) ||
          (user.phone || '').includes(search)
      );
    }
    const total = users.length;
    const paged = users.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ success: true, data: { users: paged, total, page, limit } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
