import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { SettingsRepository } from '@/repositories/settings.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    const settings = await SettingsRepository.getBusinessSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    const json = await req.json();

    const oldSettings = await SettingsRepository.getBusinessSettings();
    // Translate the admin form's camelCase fields to the canonical setting keys
    // used by the public storefront and checkout services.
    const updatedSettings = await SettingsRepository.updateBusinessSettings(json);

    await AuditRepository.log(
      'BUSINESS_SETTINGS_UPDATED',
      'BusinessSetting',
      null,
      admin.userId,
      admin.email,
      oldSettings,
      updatedSettings
    );

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

// The admin form uses PUT for an update; keep POST available for existing clients.
export async function PUT(req: NextRequest) {
  return POST(req);
}
