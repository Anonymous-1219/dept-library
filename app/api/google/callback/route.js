export const dynamic = 'force-dynamic';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = (body) => new Response(
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;max-width:560px;margin:40px auto;padding:0 20px;line-height:1.5">${body}</body>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
);

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return page('<h2>No code received</h2><p>Go back to the site and tap Connect Google Drive again.</p>');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${url.origin}/api/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  const j = await r.json();
  if (!j.refresh_token) return page(`<h2>No refresh token</h2><p>${esc(j.error_description || 'Google did not return one.')}</p><p>Remove the app from <b>myaccount.google.com/permissions</b>, then try again.</p>`);
  return page(`<h2>Google Drive connected</h2><p>Copy this value. In Vercel, add an environment variable named <b>GOOGLE_REFRESH_TOKEN</b> with it, then redeploy.</p><textarea readonly rows="5" style="width:100%;font-size:14px" onclick="this.select()">${esc(j.refresh_token)}</textarea><p>Keep it private. Anyone with it can reach your library files.</p>`);
}
