import crypto from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
let cache = { token: null, exp: 0 };

export async function driveToken() {
  if (cache.token && Date.now() < cache.exp - 60000) return cache.token;
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Google Drive is not connected yet. The owner needs to finish the Drive setup.');
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cache.token;
}

// The app keeps all PDFs in one folder it creates itself (needed for the drive.file permission).
export async function folderId(admin) {
  const { data } = await admin.from('settings').select('value').eq('key', 'drive_folder').maybeSingle();
  if (data?.value) return data.value;
  const token = await driveToken();
  const r = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Department Library files', mimeType: 'application/vnd.google-apps.folder' }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Could not create the Drive folder.');
  await admin.from('settings').upsert({ key: 'drive_folder', value: j.id });
  return j.id;
}

export async function startSession(folder, name, size) {
  const token = await driveToken();
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'application/pdf',
      'X-Upload-Content-Length': String(size),
    },
    body: JSON.stringify({ name, parents: [folder], mimeType: 'application/pdf' }),
  });
  const loc = r.headers.get('location');
  if (!r.ok || !loc) throw new Error('Drive would not start the upload.');
  return loc;
}

export async function deleteDriveFile(id) {
  try {
    const token = await driveToken();
    await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  } catch (e) {}
}

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret';

export function signToken(id) {
  const exp = Math.floor(Date.now() / 1000) + 300;
  const sig = crypto.createHmac('sha256', secret()).update(`${id}.${exp}`).digest('hex');
  return `${exp}.${sig}`;
}

export function verifyToken(id, t) {
  const [exp, sig] = String(t || '').split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const good = crypto.createHmac('sha256', secret()).update(`${id}.${exp}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch (e) { return false; }
}
