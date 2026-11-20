'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { ListSk } from '../../components/Skeletons';

export default function ConnectDrive() {
  const { user, profile, session, loading } = useAuth();
  const [err, setErr] = useState('');
  const [redirect, setRedirect] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <ListSk rows={2} />;
  if (!user || profile?.role !== 'owner') return <p>This page is only for the site owner. <Link href="/" style={{ color: 'var(--accent2)', fontWeight: 700 }}>Back to the library</Link></p>;

  async function connect() {
    setErr(''); setBusy(true);
    const r = await fetch('/api/google/url', { headers: { Authorization: `Bearer ${session.access_token}` } });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error || 'Could not start the connection.');
    setRedirect(j.redirect);
    window.location.href = j.url;
  }

  return (
    <div className="narrow">
      <h1 className="pg">Google Drive</h1>
      <p className="lede">PDFs are stored in your Google Drive, in a folder the library creates for itself.</p>
      <div className="panel txt">
        <p>Do this once, after adding GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel:</p>
        <p>1. Tap Connect and allow access with the Google account that should hold the files.</p>
        <p>2. Copy the long code shown at the end.</p>
        <p>3. In Vercel add it as GOOGLE_REFRESH_TOKEN and redeploy.</p>
        {err && <p className="error">{err}</p>}
        {redirect && <p className="small">Redirect address: {redirect}</p>}
        <button className="btn" style={{ marginTop: 16 }} onClick={connect} disabled={busy}>{busy ? 'Opening Google...' : 'Connect Google Drive'}</button>
      </div>
    </div>
  );
}
