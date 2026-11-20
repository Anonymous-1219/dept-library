import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/serverAuth';
import { folderId, startSession } from '../../../../lib/drive';
import { SITE } from '../../../../lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req) {
  const ctx = await requireUser(req);
  if (!ctx) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  if (!['rep', 'admin', 'owner'].includes(ctx.role)) return NextResponse.json({ error: 'Uploading is for approved course reps.' }, { status: 403 });

  const { size, name } = await req.json();
  if (!size || size > SITE.maxMB * 1048576) return NextResponse.json({ error: `Files must be under ${SITE.maxMB} MB.` }, { status: 400 });

  const clean = String(name || 'file').replace(/[^\w\- ]+/g, '').trim().slice(0, 80) || 'file';
  try {
    const folder = await folderId(ctx.admin);
    const session = await startSession(folder, `${clean} ${Date.now().toString(36)}.pdf`, size);
    return NextResponse.json({ session });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
