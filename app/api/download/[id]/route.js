import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/serverAuth';
import { signToken } from '../../../../lib/drive';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const ctx = await requireUser(req);
  if (!ctx) return NextResponse.json({ error: 'Sign in to download.' }, { status: 401 });
  return NextResponse.json({ url: `/api/file/${params.id}?t=${signToken(params.id)}` });
}
