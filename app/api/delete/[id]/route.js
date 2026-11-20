import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/serverAuth';
import { deleteDriveFile } from '../../../../lib/drive';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const ctx = await requireUser(req);
  if (!ctx) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const { data: doc } = await ctx.admin.from('documents').select('drive_file_id,uploaded_by,course_id').eq('id', params.id).maybeSingle();
  if (!doc) return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  const staff = ['admin', 'owner'].includes(ctx.role);
  if (!staff && doc.uploaded_by !== ctx.user.id) return NextResponse.json({ error: 'You cannot delete this file.' }, { status: 403 });
  await deleteDriveFile(doc.drive_file_id);
  await ctx.admin.from('documents').delete().eq('id', params.id);
  return NextResponse.json({ ok: true, course_id: doc.course_id });
}
