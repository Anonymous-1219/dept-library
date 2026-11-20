'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { SITE, fmtSize, levelColor } from '../../../lib/config';
import { useAuth } from '../../../components/AuthProvider';
import PdfViewer from '../../../components/PdfViewer';
import Sheet from '../../../components/Sheet';
import Icon from '../../../components/Icon';
import { DocSk } from '../../../components/Skeletons';

const REASONS = [
  ['Wrong file or wrong course', 'flag', 'l100'],
  ['Duplicate of another file', 'copy', 'l300'],
  ['Poor quality or unreadable', 'image', 'l400'],
  ['I own this and want it removed', 'lock', 'l500'],
  ['Something else', 'q', 'l200'],
];

export default function DocPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile, session } = useAuth();
  const [doc, setDoc] = useState(undefined);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [rp, setRp] = useState(false);
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [rpErr, setRpErr] = useState('');

  useEffect(() => {
    supabase.from('documents').select('*, courses(id,code,title,level)').eq('id', id).maybeSingle()
      .then(({ data }) => setDoc(data || null));
  }, [id]);

  async function download() {
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/download/${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const j = await r.json();
      if (j.url) window.location.href = j.url; else setErr(j.error || 'The download failed. Try again.');
    } catch (e) { setErr('The download failed. Check your connection and try again.'); }
    setBusy(false);
  }

  async function remove() {
    if (!confirm('Delete this file permanently?')) return;
    setBusy(true);
    const r = await fetch(`/api/delete/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error || 'Could not delete the file.');
    router.push(`/course/${j.course_id}`);
  }

  async function sendReport() {
    setRpErr('');
    const { error } = await supabase.from('reports').insert({ document_id: id, reason: REASONS[reason][0], details: details.trim() || null, reporter: user.id });
    if (error) return setRpErr('Could not send the report. Try again.');
    setSent(true);
  }

  function openReport() { setReason(null); setDetails(''); setSent(false); setRpErr(''); setRp(true); }

  if (doc === undefined) return <DocSk />;
  if (doc === null) return <p>This file does not exist. <Link href="/">Back to the library</Link></p>;

  const canDelete = user && profile && (['admin', 'owner'].includes(profile.role) || doc.uploaded_by === user.id);

  return (
    <div style={{ '--lv': levelColor(doc.courses?.level) }}>
      <p className="crumb"><Link href={`/course/${doc.course_id}`}>{doc.courses?.code}</Link></p>
      <h1 className="pg">{doc.title}</h1>
      <div className="panel" style={{ marginTop: 16 }}>
        <dl className="meta">
          <div><dt>Course</dt><dd>{doc.courses?.code}, {doc.courses?.title}</dd></div>
          <div><dt>Type</dt><dd>{doc.kind}</dd></div>
          {doc.session && <div><dt>Session</dt><dd>{doc.session}</dd></div>}
          <div><dt>Size</dt><dd>{fmtSize(doc.size_bytes)}</dd></div>
          <div><dt>Downloads</dt><dd>{doc.downloads}</dd></div>
        </dl>
      </div>

      <div className="actions">
        {user
          ? <button className="btn" onClick={download} disabled={busy}>{busy ? 'Please wait...' : 'Download PDF'}</button>
          : <Link className="btn" href={`/auth?next=/doc/${id}`}>Sign in to download</Link>}
        <button className="btn ghost" onClick={openReport}>Report a problem</button>
        {canDelete && <button className="btn ghost danger" onClick={remove} disabled={busy}>Delete file</button>}
      </div>
      {err && <p className="error">{err}</p>}

      <PdfViewer url={`/api/file/${id}`} pageLimit={user ? SITE.previewPagesMember : SITE.previewPagesGuest} />

      <Sheet open={rp} onClose={() => setRp(false)} label="Report a problem">
        <div className="sh-h">
          <span className="gtile" style={{ '--c': 'var(--l300)' }}><Icon name="flag" size={26} /></span>
          <div><h3>Report a problem</h3><p>Pick the issue and tell us what happened. We will check the file.</p></div>
          <button className="sh-x" onClick={() => setRp(false)} aria-label="Close"><Icon name="x" size={20} /></button>
        </div>
        {!user ? (
          <div style={{ marginTop: 20 }}>
            <p className="muted">Please sign in so we can follow up on your report.</p>
            <Link className="btn block" style={{ marginTop: 14 }} href={`/auth?next=/doc/${id}`}>Sign in</Link>
          </div>
        ) : sent ? (
          <div style={{ marginTop: 20 }}>
            <div className="panel" style={{ textAlign: 'center' }}>
              <div className="gtile" style={{ '--c': 'var(--l500)', margin: '0 auto 12px' }}><Icon name="shield" size={26} /></div>
              <b style={{ fontSize: 18 }}>Thanks, report sent.</b>
              <p className="muted">We will review this file soon.</p>
            </div>
            <button className="btn block" style={{ marginTop: 16 }} onClick={() => setRp(false)}>Close</button>
          </div>
        ) : (
          <>
            <div className="q">1. What kind of issue is it?</div>
            {REASONS.map(([label, icon, c], i) => (
              <button key={label} className={'opt' + (reason === i ? ' on' : '')} onClick={() => setReason(i)}>
                <span className="gtile sm" style={{ '--c': `var(--${c})` }}><Icon name={icon} size={20} /></span>{label}
              </button>
            ))}
            <div className="q">2. What happened? <span className="count">{details.length}/500</span></div>
            <div className="form">
              <textarea maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Explain the issue clearly: what is wrong and what you need." />
            </div>
            {rpErr && <p className="error">{rpErr}</p>}
            <button className="btn block" style={{ marginTop: 16 }} disabled={reason === null} onClick={sendReport}>Send report</button>
            {reason === null && <p className="muted" style={{ textAlign: 'center' }}>Choose the type of issue first.</p>}
          </>
        )}
      </Sheet>
    </div>
  );
}
