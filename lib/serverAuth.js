import { adminClient } from './admin';

// Returns { user, role, admin } for a valid Bearer token, otherwise null.
export async function requireUser(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  const admin = adminClient();
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return null;
  const { data: p } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return { user: data.user, role: p?.role || 'student', admin };
}
