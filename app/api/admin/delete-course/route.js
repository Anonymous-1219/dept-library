import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/serverAuth';
import { deleteDriveFile } from '../../../../lib/drive';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  const ctx = await requireUser(req);
  if (!ctx || !['admin', 'owner'].includes(ctx.role)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const { id } = await req.json();
  const { data: files } = await ctx.admin.from('documents').select('drive_file_id').eq('course_id', id);
  await Promise.all((files || []).map((f) => deleteDriveFile(f.drive_file_id)));
  const { error } = await ctx.admin.from('courses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
