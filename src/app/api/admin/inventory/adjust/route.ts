import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { InventoryAdjustSchema } from '@/schemas';
import { PermissionKey, InventoryChangeReason } from '@/types';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_INVENTORY);
    const json = await req.json();
    // Strict validation: a non-numeric quantityChange previously corrupted
    // stock balances (e.g. "abc" turned stock 25 into the string "25abc").
    const { variantId, quantityChange, reason } = InventoryAdjustSchema.parse(json);

    const changeReason =
      reason === 'DAMAGE'
        ? InventoryChangeReason.DAMAGE_WRITE_OFF
        : reason === 'RESTOCK'
        ? InventoryChangeReason.MANUAL_RESTOCK
        : InventoryChangeReason.STOCK_AUDIT_ADJUSTMENT;

    const result = await InventoryRepository.adjustStock(
      variantId,
      quantityChange,
      changeReason,
      `manual_admin_${admin.userId}`,
      `Adjusted by ${admin.email}`
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
