'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { ListSk } from '../../components/Skeletons';

const today = () => new Date().toISOString().slice(0, 10);
function status(a) {
  if (!a.active) return 'Paused';
  if (a.starts_on && a.starts_on > today()) return `Scheduled, starts ${a.starts_on}`;
  if (a.ends_on && a.ends_on < today()) return 'Ended';
  return 'Live';
}

export default function AdsPage() {
  const { user, profile, loading } = useAuth();
  const [rows, setRows] = useState(null);
  const [f, setF] = useState({ advertiser: '', title: '', text: '', link: 'https://', placement: 'body', starts_on: '', ends_on: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const load = () => supabase.from('ads').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  useEffect(() => { if (profile?.role === 'owner') load(); }, [profile]);

  if (loading) return <ListSk rows={3} />;
  if (!user || profile?.role !== 'owner') return <p>This page is only for the site owner. <Link href="/" style={{ color: 'var(--accent2)', fontWeight: 700 }}>Back to the library</Link></p>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault(); setErr('');
    if (!/^https?:\/\//i.test(f.link)) return setErr('The link must start with http:// or https://');
    const file = fileRef.current.files[0];
    if (!file) return setErr('Choose a picture or video.');
    const isVideo = file.type.startsWith('video/');
    if (!isVideo && !file.type.startsWith('image/')) return setErr('Use a picture or a video file.');
    if (file.size > 20 * 1048576) return setErr('Keep the file under 20 MB. Short, compressed videos work best.');

    setBusy(true);
    const ext = (file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from('ads').upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setErr('Upload failed: ' + up.error.message); }
    const { data: pub } = supabase.storage.from('ads').getPublicUrl(path);
    const ins = await supabase.from('ads').insert({
      advertiser: f.advertiser.trim(), title: f.title.trim(), text: f.text.trim() || null, link: f.link.trim(),
      placement: f.placement, media_url: pub.publicUrl, media_path: path, media_type: isVideo ? 'video' : 'image',
      starts_on: f.starts_on || null, ends_on: f.ends_on || null,
    });
    setBusy(false);
    if (ins.error) { await supabase.storage.from('ads').remove([path]); return setErr('Could not save the ad: ' + ins.error.message); }
    setF({ advertiser: '', title: '', text: '', link: 'https://', placement: 'body', starts_on: '', ends_on: '' });
    fileRef.current.value = '';
    load();
  }

  async function toggle(a) {
    await supabase.from('ads').update({ active: !a.active }).eq('id', a.id);
    load();
  }
  async function remove(a) {
    if (!confirm(`Delete the ad for ${a.advertiser}?`)) return;
    await supabase.from('ads').delete().eq('id', a.id);
    if (a.media_path) await supabase.storage.from('ads').remove([a.media_path]);
    load();
  }

  return (
    <>
      <h1 className="pg">Ads</h1>
      <div className="note">Only you, the owner, can open this page. Admins and course reps cannot.</div>
      {rows === null && <ListSk rows={3} />}
      {rows && rows.length === 0 && <p className="muted">No ads yet. Add the first one below.</p>}
      {rows && rows.map((a) => (
        <div key={a.id} className="item">
          <span className="im">
            <span className="it">{a.advertiser}</span><br />
            <span className="is">{a.placement === 'body' ? 'Body card' : 'Bottom banner'}, {a.media_type}, {status(a)}</span><br />
            <span className="is">{a.views} views, {a.taps} taps</span>
          </span>
          <button className="mini" onClick={() => toggle(a)}>{a.active ? 'Pause' : 'Resume'}</button>
          <button className="mini danger" onClick={() => remove(a)}>Delete</button>
        </div>
      ))}

      <h2 className="sec">Add an ad</h2>
      <div className="panel">
        <form onSubmit={save} className="form">
          <label>Advertiser name (only you see this)<input value={f.advertiser} onChange={set('advertiser')} required maxLength={80} /></label>
          <label>Headline shown on the ad<input value={f.title} onChange={set('title')} required maxLength={90} /></label>
          <label>One short line (optional)<input value={f.text} onChange={set('text')} maxLength={120} /></label>
          <label>Link (opens in a new tab)<input value={f.link} onChange={set('link')} required inputMode="url" /></label>
          <label>Where it shows
            <select value={f.placement} onChange={set('placement')}><option value="body">Body card</option><option value="bottom">Bottom banner</option></select>
          </label>
          <label>Picture or video<input ref={fileRef} type="file" accept="image/*,video/*" required /></label>
          <label>Starts (optional)<input type="date" value={f.starts_on} onChange={set('starts_on')} /></label>
          <label>Ends (optional)<input type="date" value={f.ends_on} onChange={set('ends_on')} /></label>
          {err && <p className="error">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save ad'}</button>
        </form>
      </div>
    </>
  );
}
