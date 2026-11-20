'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ResetPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === 'PASSWORD_RECOVERY' || s) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault(); setErr('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message); else { setDone(true); setTimeout(() => { window.location.href = '/'; }, 1200); }
  }

  return (
    <div className="narrow">
      <h1 className="pg">Set a new password</h1>
      {!ready && <p className="lede">Open this page from the link in your reset email.</p>}
      {ready && (
        <div className="panel" style={{ marginTop: 18 }}>
          <form onSubmit={submit} className="form">
            <label>New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
            </label>
            {err && <p className="error">{err}</p>}
            {done && <p className="ok">Password updated.</p>}
            <button className="btn">Save password</button>
          </form>
        </div>
      )}
    </div>
  );
}
