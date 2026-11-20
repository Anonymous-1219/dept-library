import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const ctx = await requireUser(req);
  if (!ctx || ctx.role !== 'owner') return NextResponse.json({ error: 'Only the owner can do this.' }, { status: 403 });
  if (!process.env.GOOGLE_CLIENT_ID) return NextResponse.json({ error: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel first.' }, { status: 400 });
  const redirect = `${new URL(req.url).origin}/api/google/callback`;
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
  });
  return NextResponse.json({ url, redirect });
}
