'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { SITE, semesterName } from '../../lib/config';
import { useAuth } from '../../components/AuthProvider';
import { ListSk } from '../../components/Skeletons';

export default function AdminPage() {
  const { user, profile, session, loading } = useAuth();
  const [tab, setTab] = useState('people');
  const [n, setN] = useState({ reports: 0, requests: 0 });

  const loadCounts = () => {
    supabase.from('reports').select('id', { count: 'exact', head: true }).then(({ count }) => setN((x) => ({ ...x, reports: count || 0 })));
    supabase.from('requests').select('id', { count: 'exact', head: true }).then(({ count }) => setN((x) => ({ ...x, requests: count || 0 })));
  };
  useEffect(() => { if (profile && ['admin', 'owner'].includes(profile.role)) loadCounts(); }, [profile]);

  if (loading) return <ListSk rows={4} />;
  if (!user || !['admin', 'owner'].includes(profile?.role)) return <p>This page is for admins. <Link href="/" style={{ color: 'var(--accent2)', fontWeight: 700 }}>Back to the library</Link></p>;

  const tabs = [['people', 'People'], ['courses', 'Courses'], ['reports', `Reports${n.reports ? ` (${n.reports})` : ''}`], ['requests', `Requests${n.requests ? ` (${n.requests})` : ''}`]];
  return (
    <>
      <h1 className="pg">Admin</h1>
      <div className="tabs">
        {tabs.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      {tab === 'people' && <People me={user.id} myRole={profile.role} />}
      {tab === 'courses' && <Courses token={session.access_token} />}
      {tab === 'reports' && <Reports onChange={loadCounts} />}
      {tab === 'requests' && <Requests onChange={loadCounts} />}
    </>
  );
}

function People({ me, myRole }) {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);

  async function setRole(id, role) {
    setErr('');
    const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select();
    if (error || !data?.length) return setErr(error?.message || 'Could not change the role.');
    setRows((r) => r.map((p) => (p.id === id ? { ...p, role } : p)));
  }

  const f = filter.trim().toLowerCase();
  const list = (rows || []).filter((p) => !f || (p.email || '').toLowerCase().includes(f) || (p.full_name || '').toLowerCase().includes(f));

  return (
    <section>
      <div className="search" style={{ marginTop: 0, marginBottom: 16 }}>
        <input placeholder="Find someone by name or email" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ paddingLeft: 18 }} />
      </div>
      {err && <p className="error">{err}</p>}
      {rows === null && <ListSk rows={4} />}
      {list.map((p) => {
        const locked = p.id === me || p.role === 'owner' || (myRole === 'admin' && p.role === 'admin');
        return (
          <div key={p.id} className="item">
            <span className="im">
              <span className="it">{p.full_name || p.email}</span><br />
              <span className="is">{p.full_name ? p.email : ''}</span>
            </span>
            <select className="rowsel" value={p.role} disabled={locked} onChange={(e) => setRole(p.id, e.target.value)} aria-label={`Role for ${p.email}`}>
              <option value="student">Student</option>
              <option value="rep">Course rep</option>
              {(myRole === 'owner' || p.role === 'admin') && <option value="admin">Admin</option>}
              {p.role === 'owner' && <option value="owner">Owner</option>}
            </select>
          </div>
        );
      })}
    </section>
  );
}

function Courses({ token }) {
  const [rows, setRows] = useState(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState(SITE.levels[0]);
  const [semester, setSemester] = useState(1);
  const [err, setErr] = useState('');

  const load = () => supabase.from('courses').select('*').order('level').order('code').then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('courses').insert({
      code: code.trim().toUpperCase().replace(/\s+/g, ' '), title: title.trim(), level: Number(level), semester: Number(semester),
    });
    if (error) return setErr(error.code === '23505' ? 'A course with that code already exists.' : error.message);
    setCode(''); setTitle(''); load();
  }

  async function remove(c) {
    if (!confirm(`Delete ${c.code} and every file in it?`)) return;
    const r = await fetch('/api/admin/delete-course', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) });
    const j = await r.json();
    if (!r.ok) setErr(j.error || 'Could not delete the course.'); else load();
  }

  return (
    <section>
      <div className="panel">
        <form onSubmit={add} className="form">
          <label>Course code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CSC 201" required maxLength={20} /></label>
          <label>Course title<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label>
          <label>Level<select value={level} onChange={(e) => setLevel(e.target.value)}>{SITE.levels.map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
          <label>Semester
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value={1}>{semesterName(1)}</option><option value={2}>{semesterName(2)}</option>
            </select>
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn">Add course</button>
        </form>
      </div>
      <h2 className="sec">All courses</h2>
      {rows === null && <ListSk rows={3} />}
      {rows && rows.length === 0 && <p className="muted">No courses yet. Add the first one above.</p>}
      {rows && rows.map((c) => (
        <div key={c.id} className="item" style={{ '--lv': `var(--l${c.level})` }}>
          <span className="tile">{c.code.split(' ')[0]}</span>
          <span className="im"><span className="it">{c.code}</span><br /><span className="is">{c.title}, {c.level} level, {semesterName(c.semester).toLowerCase()}</span></span>
          <button className="mini danger" onClick={() => remove(c)}>Delete</button>
        </div>
      ))}
    </section>
  );
}

function Reports({ onChange }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    supabase.from('reports').select('*, documents(id,title)').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);
  async function dismiss(id) {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (!error) { setRows((r) => r.filter((x) => x.id !== id)); onChange(); }
  }
  return (
    <section>
      {rows === null && <ListSk rows={3} />}
      {rows && rows.length === 0 && <p className="muted">No reports. All clear.</p>}
      {rows && rows.map((r) => (
        <div key={r.id} className="item">
          <span className="im">
            <span className="it">{r.documents?.title || 'Deleted file'}</span><br />
            <span className="is">{r.reason}{r.details ? `: ${r.details}` : ''}</span>
          </span>
          {r.documents && <Link className="mini" href={`/doc/${r.documents.id}`} style={{ display: 'grid', placeItems: 'center' }}>Open</Link>}
          <button className="mini" onClick={() => dismiss(r.id)}>Dismiss</button>
        </div>
      ))}
    </section>
  );
}

function Requests({ onChange }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    supabase.from('requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);
  async function done(id) {
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (!error) { setRows((r) => r.filter((x) => x.id !== id)); onChange(); }
  }
  return (
    <section>
      {rows === null && <ListSk rows={3} />}
      {rows && rows.length === 0 && <p className="muted">No open requests.</p>}
      {rows && rows.map((r) => (
        <div key={r.id} className="item">
          <span className="im"><span className="it">{r.course_text}: {r.details}</span></span>
          <button className="mini" onClick={() => done(r.id)}>Mark done</button>
        </div>
      ))}
    </section>
  );
}
