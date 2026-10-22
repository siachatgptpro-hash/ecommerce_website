import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 0 };
  // Clear the canonical session cookie set by login/register.
  // (The 'sholkveda_…' name is also cleared defensively for any legacy cookies.)
  response.cookies.set('shlokveda_session_token', '', cookieOptions);
  response.cookies.set('sholkveda_session_token', '', cookieOptions);
  return response;
}
