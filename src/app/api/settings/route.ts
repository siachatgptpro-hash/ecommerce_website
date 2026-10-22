import { NextResponse } from 'next/server';
import { SettingsRepository } from '@/repositories/settings.repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await SettingsRepository.getBusinessSettings();
  return NextResponse.json({
    success: true,
    data: settings,
    headers: { 'Cache-Control': 'no-store' },
  });
}
