'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Ctx = createContext({ session: null, user: null, profile: null, loading: true });
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  useEffect(() => {
    if (!uid) { setProfile(null); return; }
    let live = true;
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => {
      if (live) { setProfile(data); setLoading(false); }
    });
    return () => { live = false; };
  }, [uid]);

  return <Ctx.Provider value={{ session, user: session?.user ?? null, profile, loading }}>{children}</Ctx.Provider>;
}
