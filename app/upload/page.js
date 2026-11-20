'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { SITE, semesterName } from '../../lib/config';
import { useAuth } from '../../components/AuthProvider';
import { PageSk } from '../../components/Skeletons';

const CHUNK = 3670016; // 3.5 MB, a multiple of 256 KB as Google requires

export default function UploadPage() {
  const { user, profile, session, loading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState(SITE.kinds[0]);
  const [sess, setSess] = useState('');
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase.from('courses').select('id,code,title,level,semester').order('level').order('code').then(({ data }) => {
      setCourses(data || []);
      const pre = new URLSearchParams(window.location.search).get('course');
      if (pre) setCourseId(pre);
    });
  }, []);

  if (loading) return <PageSk />;
  if (!user) return <p>Please <Link href="/auth?next=/upload" style={{ color: 'var(--accent2)', fontWeight: 700 }}>sign in</Link> to upload.</p>;
  if (!profile || !['rep', 'admin', 'owner'].includes(profile.role)) {
    return (
      <div className="narrow">
        <h1 className="pg">Upload</h1>
        <p className="lede">Uploading is for approved course reps. Ask the admin to approve your account, using the email you signed up with: <strong>{user.email}</strong>.</p>
      </div>
    );
  }

  function onFile(e) {
    const f = e.target.files[0];
    if (f && !title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '));
  }

  async function submit(e) {
    e.preventDefault();
    setErr(''); setDone(null);
    const file = fileRef.current.files[0];
    if (!courseId) return setErr('Choose a course.');
    if (!file) return setErr('Choose a PDF file.');
    if (!file.name.toLowerCase().endsWith('.pdf')) return setErr('Only PDF files are allowed.');
    if (file.size > SITE.maxMB * 1048576) return setErr(`That file is larger than ${SITE.maxMB} MB.`);
    if (!rights) return setErr('Please confirm you are allowed to share this file.');

    setBusy(true); setPct(0);
    const auth = { Authorization: `Bearer ${session.access_token}` };
    try {
      const s = await fetch('/api/upload/start', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ size: file.size, name: title }) });
      const sj = await s.json();
      if (!s.ok) throw new Error(sj.error || 'Could not start the upload.');

      let offset = 0, fileId = null, stuck = 0;
      while (offset < file.size) {
        const end = Math.min(offset + CHUNK, file.size);
        const r = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers: { ...auth, 'x-session': sj.session, 'x-start': String(offset), 'x-total': String(file.size) },
          body: file.slice(offset, end),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'The upload failed.');
        if (j.done) { fileId = j.fileId; offset = file.size; }
        else {
          const next = typeof j.next === 'number' ? j.next : end;
          stuck = next <= offset ? stuck + 1 : 0;
          if (stuck > 3) throw new Error('The upload stalled. Please try again.');
          offset = next;
        }
        setPct(Math.min(99, Math.round((offset / file.size) * 100)));
      }
      if (!fileId) throw new Error('Drive did not confirm the file. Please try again.');

      const ins = await supabase.from('documents').insert({
        course_id: courseId, title: title.trim(), kind, session: sess.trim() || null,
        drive_file_id: fileId, size_bytes: file.size, uploaded_by: user.id,
      }).select('id').single();
      if (ins.error) throw new Error('Saved to Drive, but could not save the details: ' + ins.error.message);

      setPct(100); setDone(ins.data.id);
      setTitle(''); setSess(''); setRights(false); fileRef.current.value = '';
    } catch (e2) {
      setErr(e2.message || 'The upload failed.');
    }
    setBusy(false);
  }

  return (
    <div className="narrow">
      <h1 className="pg">Upload a PDF</h1>
      <div className="panel" style={{ marginTop: 18 }}>
        <form onSubmit={submit} className="form">
          <label>Course
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">Choose a course</option>
              {SITE.levels.map((l) => {
                const list = courses.filter((c) => c.level === l);
                if (!list.length) return null;
                return (
                  <optgroup key={l} label={`${l} level`}>
                    {list.map((c) => <option key={c.id} value={c.id}>{c.code}, {c.title} ({semesterName(c.semester).toLowerCase()})</option>)}
                  </optgroup>
                );
              })}
            </select>
          </label>
          <label>PDF file<input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFile} required /></label>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} /></label>
          <label>Type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>{SITE.kinds.map((k) => <option key={k}>{k}</option>)}</select>
          </label>
          <label>Session (optional)<input value={sess} onChange={(e) => setSess(e.target.value)} placeholder="2023/2024" maxLength={20} /></label>
          <label className="chk"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> I am allowed to share this file</label>
          <p className="small" style={{ marginTop: -6 }}>Scanned textbooks need the author’s permission.</p>
          {busy && <div><div className="prog"><i style={{ width: pct + '%' }} /></div><p className="small" style={{ marginTop: 8 }}>Uploading, {pct}%. Please keep this page open.</p></div>}
          {err && <p className="error">{err}</p>}
          {done && <p className="ok">Uploaded. <Link href={`/doc/${done}`} style={{ color: 'var(--accent2)', fontWeight: 700 }}>Open the file</Link></p>}
          <button className="btn" disabled={busy}>{busy ? 'Uploading...' : 'Upload'}</button>
        </form>
      </div>
    </div>
  );
}
