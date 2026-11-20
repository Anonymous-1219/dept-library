'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const nextUrl = () => {
    const n = new URLSearchParams(window.location.search).get('next');
    return n && n.startsWith('/') ? n : '/';
  };

  async function submit(e) {
    e.preventDefault();
    setErr(''); setMsg(''); setBusy(true);
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setErr(error.message);
      window.location.href = nextUrl();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      setBusy(false);
      if (error) return setErr(error.message);
      if (data.session) window.location.href = nextUrl();
      else setMsg('Account created. Check your email to confirm it, then sign in.');
    }
  }

  async function forgot() {
    setErr(''); setMsg('');
    if (!email) return setErr('Enter your email above first.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` });
    if (error) setErr(error.message); else setMsg('We sent a reset link to your email.');
  }

  return (
    <div className="narrow">
      <h1 className="pg">{mode === 'in' ? 'Welcome back' : 'Create an account'}</h1>
      <p className="lede">{mode === 'in' ? 'Sign in to download files.' : 'It takes a minute.'}</p>
      <div className="panel">
        <form onSubmit={submit} className="form">
          {mode === 'up' && (
            <label>Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </label>
          )}
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              minLength={mode === 'up' ? 8 : undefined} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
          </label>
          {err && <p className="error">{err}</p>}
          {msg && <p className="ok">{msg}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Please wait...' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
        </form>
      </div>
      <p className="muted">
        {mode === 'in' ? 'New here? ' : 'Already have an account? '}
        <button className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); setMsg(''); }}>
          {mode === 'in' ? 'Create an account' : 'Sign in'}
        </button>
        {mode === 'in' && <> or <button className="link" onClick={forgot}>reset your password</button></>}
      </p>
    </div>
  );
}
