'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';

export default function RequestPage() {
  const { user, loading } = useAuth();
  const [course, setCourse] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await supabase.from('requests').insert({ course_text: course.trim(), details: details.trim(), requester: user.id });
    setBusy(false);
    if (error) return setErr('Could not send your request. Try again.');
    setDone(true); setCourse(''); setDetails('');
  }

  return (
    <div className="narrow">
      <h1 className="pg">Request a file</h1>
      <p className="lede">Can not find a past question or note? Tell us and a course rep will look for it.</p>
      <div className="panel">
        {!loading && !user ? (
          <p>Please <Link href="/auth?next=/request" style={{ color: 'var(--accent2)', fontWeight: 700 }}>sign in</Link> to send a request.</p>
        ) : done ? (
          <p style={{ fontWeight: 700 }}>Request sent. Course reps can see it now.</p>
        ) : (
          <form onSubmit={submit} className="form">
            <label>Course<input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="CSC 305" required maxLength={60} /></label>
            <label>What do you need?<input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="2022 past questions" required maxLength={200} /></label>
            {err && <p className="error">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send request'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
