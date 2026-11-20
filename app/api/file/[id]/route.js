import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/admin';
import { driveToken, verifyToken } from '../../../../lib/drive';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Streams a PDF from Drive. Without ?t= it is an inline preview, with a valid ?t= it is a download.
export async function GET(req, { params }) {
  const admin = adminClient();
  const t = new URL(req.url).searchParams.get('t');
  const { data: doc } = await admin.from('documents').select('drive_file_id,title').eq('id', params.id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  const download = !!t;
  if (download && !verifyToken(params.id, t)) return NextResponse.json({ error: 'This download link expired. Try again.' }, { status: 403 });

  let token;
  try { token = await driveToken(); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }

  const headers = { Authorization: `Bearer ${token}` };
  const range = req.headers.get('range');
  if (range) headers.Range = range;

  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.drive_file_id}?alt=media`, { headers });
  if (!r.ok && r.status !== 206) return NextResponse.json({ error: 'Could not read the file from Drive.' }, { status: 502 });

  const h = new Headers();
  h.set('Content-Type', 'application/pdf');
  h.set('Accept-Ranges', 'bytes');
  for (const k of ['content-length', 'content-range']) { const v = r.headers.get(k); if (v) h.set(k, v); }
  const name = (doc.title.replace(/[^\w\- ]+/g, '').trim() || 'document') + '.pdf';
  h.set('Content-Disposition', download ? `attachment; filename="${name}"` : 'inline');
  h.set('Cache-Control', 'private, max-age=600');

  if (download && !range) await admin.rpc('increment_downloads', { doc: params.id });
  return new Response(r.body, { status: r.status, headers: h });
}
