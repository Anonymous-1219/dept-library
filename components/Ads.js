'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getConsent } from '../lib/consent';
import Icon from './Icon';

const Ctx = createContext({ body: null, bottom: null });

function isLive(a) {
  const t = new Date().toISOString().slice(0, 10);
  return a.active && (!a.starts_on || a.starts_on <= t) && (!a.ends_on || a.ends_on >= t);
}
const pick = (list) => (list.length ? list[Math.floor(Math.random() * list.length)] : null);

export function AdsProvider({ children }) {
  const [ads, setAds] = useState({ body: null, bottom: null });
  useEffect(() => {
    supabase.from('ads').select('*').then(({ data }) => {
      const live = (data || []).filter(isLive);
      setAds({ body: pick(live.filter((a) => a.placement === 'body')), bottom: pick(live.filter((a) => a.placement === 'bottom')) });
    });
  }, []);
  return <Ctx.Provider value={ads}>{children}</Ctx.Provider>;
}

function track(id, kind) {
  if (getConsent() !== 'yes') return;
  supabase.rpc('track_ad', { ad: id, kind }).then(() => {});
}

function Media({ ad }) {
  return ad.media_type === 'video'
    ? <video src={ad.media_url} muted loop autoPlay playsInline preload="metadata" />
    : <img src={ad.media_url} alt="" loading="lazy" />;
}

function useView(id) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { track(id, 'view'); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return ref;
}

export function BodyAd() {
  const { body: ad } = useContext(Ctx);
  if (!ad) return null;
  return <AdCard ad={ad} />;
}

function AdCard({ ad }) {
  const ref = useView(ad.id);
  return (
    <a ref={ref} className="ad" href={ad.link} target="_blank" rel="sponsored noopener noreferrer" onClick={() => track(ad.id, 'tap')}>
      <span className="art"><Media ad={ad} /></span>
      <span className="im">
        <span className="adtag">Sponsored</span><br />
        <span className="at">{ad.title}</span><br />
        {ad.text && <span className="as">{ad.text}</span>}
      </span>
    </a>
  );
}

export function BottomAd() {
  const { bottom: ad } = useContext(Ctx);
  if (!ad) return null;
  return <AdBanner ad={ad} />;
}

function AdBanner({ ad }) {
  const ref = useView(ad.id);
  return (
    <a ref={ref} className="adwide" href={ad.link} target="_blank" rel="sponsored noopener noreferrer" onClick={() => track(ad.id, 'tap')}>
      <div className="art2">
        <Media ad={ad} />
        {ad.media_type === 'video' && <span className="vbadge">Video, muted</span>}
      </div>
      <div className="cap">
        <span className="adtag">Sponsored</span><br />
        <span className="at">{ad.title}</span>
        {ad.text && <><br /><span className="as">{ad.text}</span></>}
      </div>
    </a>
  );
}

export { Icon };
