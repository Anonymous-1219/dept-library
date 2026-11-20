import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req) {
  const ctx = await requireUser(req);
  if (!ctx || !['rep', 'admin', 'owner'].includes(ctx.role)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });

  const session = req.headers.get('x-session') || '';
  const start = Number(req.headers.get('x-start'));
  const total = Number(req.headers.get('x-total'));
  if (!session.startsWith('https://www.googleapis.com/upload/drive/v3/files') || !(total > 0) || !(start >= 0)) {
    return NextResponse.json({ error: 'Bad upload request.' }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return NextResponse.json({ error: 'Empty chunk.' }, { status: 400 });
  const end = start + buf.length - 1;

  const r = await fetch(session, {
    method: 'PUT',
    headers: { 'Content-Range': `bytes ${start}-${end}/${total}` },
    body: buf,
    redirect: 'manual',
  });

  if (r.status === 200 || r.status === 201) {
    const j = await r.json();
    return NextResponse.json({ done: true, fileId: j.id });
  }
  if (r.status === 308) {
    const range = r.headers.get('range');
    const next = range ? Number(range.split('-')[1]) + 1 : 0;
    return NextResponse.json({ done: false, next });
  }
  return NextResponse.json({ error: `Drive rejected the upload (${r.status}).` }, { status: 502 });
}
