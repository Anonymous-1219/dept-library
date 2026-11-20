'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { SITE } from '../lib/config';
import { getConsent, setConsent } from '../lib/consent';
import Icon, { Logo } from './Icon';
import Sheet from './Sheet';
import { BottomAd } from './Ads';

function titleFor(path) {
  if (path === '/') return 'Library';
  const lv = path.match(/^\/level\/(\d+)/);
  if (lv) return `${lv[1]} level`;
  const map = { course: 'Course', doc: 'File', auth: 'Sign in', upload: 'Upload', admin: 'Admin', ads: 'Ads', request: 'Request', privacy: 'Privacy', 'connect-drive': 'Google Drive' };
  return map[path.split('/')[1]] || 'Library';
}

export default function Shell({ children }) {
  const path = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [settings, setSettings] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [consent, setConsentState] = useState('unknown');
  const [splash, setSplash] = useState(false);
  const [slow, setSlow] = useState(false);
  const ready = useRef(false);
  const shownAt = useRef(0);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'dark');
    setConsentState(getConsent());
  }, []);

  // Opening screen: only on the first visit of a session, and only if loading is slow.
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem('seen'); } catch (e) {}
    if (seen) return;
    const show = setTimeout(() => { if (!ready.current) { shownAt.current = Date.now(); setSplash(true); } }, 700);
    const slowT = setTimeout(() => { if (!ready.current) setSlow(true); }, 4000);
    return () => { clearTimeout(show); clearTimeout(slowT); };
  }, []);
  useEffect(() => {
    if (loading) return;
    ready.current = true;
    try { sessionStorage.setItem('seen', '1'); } catch (e) {}
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), Math.max(0, 700 - (Date.now() - shownAt.current)));
    return () => clearTimeout(t);
  }, [loading, splash]);

  useEffect(() => { setDrawer(false); setSettings(false); }, [path]);
  const closeSettings = useCallback(() => setSettings(false), []);

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    setTheme(t);
  }
  function choose(v) { setConsent(v); setConsentState(v); }
  function goSearch() {
    if (path === '/') {
      const q = document.getElementById('q');
      if (q) { q.focus(); q.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    } else {
      try { sessionStorage.setItem('focusSearch', '1'); } catch (e) {}
      router.push('/');
    }
  }

  const role = profile?.role;
  const staff = ['admin', 'owner'].includes(role);
  const canUpload = ['rep', 'admin', 'owner'].includes(role);
  const name = profile?.full_name || user?.email || '';
  const initials = name.split(/[ @.]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || 'U';
  const first = (profile?.full_name || '').split(' ')[0] || (user?.email || '').split('@')[0];
  const homeActive = path === '/' || /^\/(level|course|doc)\//.test(path);
  const thirdHref = canUpload ? '/upload' : '/request';
  const showAd = path === '/' || /^\/(level|course|doc)\//.test(path);

  const row = (href, icon, label) => (
    <Link href={href} className={'dri' + (path === href ? ' on' : '')} onClick={() => setDrawer(false)}>
      <Icon name={icon} />{label}
    </Link>
  );

  return (
    <>
      <header className="hd">
        <div className="hdcard glass">
          <div className="hl">
            <button className="icn" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon name="menu" size={24} /></button>
            <b>{titleFor(path)}</b>
          </div>
          {user
            ? <div className="chip"><span>{first}</span><span className="av">{initials}</span></div>
            : !loading && <Link href="/auth" className="signin">Sign in</Link>}
        </div>
      </header>

      <main className="wrap">
        {children}
        {showAd && <BottomAd />}
      </main>

      <footer className="site">
        <div className="fl">
          <Link href="/privacy">Privacy and terms</Link>
          <Link href="/request">Request a file</Link>
          <a href={`mailto:${SITE.contactEmail}?subject=Advertising`}>Advertise here</a>
        </div>
        <div className="fc">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <span>Built by {SITE.developer}</span>
        </div>
      </footer>

      <nav className="dock">
        <div className="dockin glass">
          <Link href="/" className={'dk' + (homeActive ? ' on' : '')} aria-label="Home"><Icon name="home" size={26} /></Link>
          <button className="dk" onClick={goSearch} aria-label="Search"><Icon name="search" size={26} /></button>
          <Link href={thirdHref} className={'dk' + (path === thirdHref ? ' on' : '')} aria-label={canUpload ? 'Upload' : 'Request a file'}>
            <Icon name={canUpload ? 'up' : 'help'} size={26} />
          </Link>
          <button className="dk" onClick={() => setSettings(true)} aria-label="Settings"><Icon name="gear" size={26} /></button>
        </div>
      </nav>

      {consent === null && (
        <div className="cookie glass">
          <p>We use cookies to remember your theme and to count ad views. You can say no and the site still works.</p>
          <div className="row">
            <button onClick={() => choose('no')}>Decline</button>
            <button className="yes" onClick={() => choose('yes')}>Accept</button>
          </div>
        </div>
      )}

      <div className={'scrim' + (drawer ? ' on' : '')} onClick={() => setDrawer(false)} />
      <aside className={'drawer glass' + (drawer ? ' on' : '')} aria-hidden={!drawer}>
        <div className="drbrand"><Logo /><div><b>{SITE.name}</b><span>Student workspace</span></div></div>
        <div className="drlab">Browse</div>
        {row('/', 'home', 'Library')}
        {SITE.levels.map((l) => (
          <Link key={l} href={`/level/${l}`} className={'dri' + (path === `/level/${l}` ? ' on' : '')} onClick={() => setDrawer(false)}>
            <span className="dot" style={{ '--lv': `var(--l${l})`, margin: '0 5px' }} />{l} level
          </Link>
        ))}
        <div className="drlab">Contribute</div>
        {row('/request', 'help', 'Request a file')}
        {canUpload && row('/upload', 'up', 'Upload a PDF')}
        {staff && <><div className="drlab">Manage</div>{row('/admin', 'shield', 'Admin')}</>}
        {role === 'owner' && <>{row('/ads', 'meg', 'Ads')}{row('/connect-drive', 'drive', 'Google Drive')}</>}
        <div className="drlab">About</div>
        {row('/privacy', 'lock', 'Privacy and terms')}
      </aside>

      <Sheet open={settings} onClose={closeSettings} label="Settings">
        <div className="sh-h">
          <span className="gtile" style={{ '--c': 'var(--l200)' }}><Icon name="gear" size={26} /></span>
          <div><h3>Settings</h3><p>Make the library yours.</p></div>
          <button className="sh-x" onClick={closeSettings} aria-label="Close"><Icon name="x" size={20} /></button>
        </div>
        <div className="q">Appearance</div>
        <div className="seg">
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => applyTheme('dark')}>Dark</button>
          <button className={theme === 'light' ? 'on' : ''} onClick={() => applyTheme('light')}>Light</button>
        </div>
        <div className="q">Account</div>
        {user
          ? <button className="srow" onClick={() => { supabase.auth.signOut(); closeSettings(); }}><span>Sign out<small>{user.email}</small></span></button>
          : <Link className="srow" href="/auth"><span>Sign in<small>Download files and report problems</small></span></Link>}
        <Link className="srow" href="/privacy"><span>Privacy and terms</span></Link>
        <button className="srow" onClick={() => { setConsentState(null); closeSettings(); }}><span>Cookie choice<small>Change what we may count</small></span></button>
      </Sheet>

      <div className={'splash' + (splash ? '' : ' out')} aria-hidden={!splash}>
        <div className="orbs"><div className="orb o1" /><div className="orb o2" /></div>
        <div className="sp-logo"><Logo size={70} /><b>Department<br />Library</b></div>
        <div className="sp-tag">{SITE.tagline}</div>
        <div className={'sp-slow' + (slow ? ' on' : '')}>Still loading. Your connection may be slow.</div>
        <div className="sp-track"><i /></div>
      </div>
    </>
  );
}
