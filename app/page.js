'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { SITE, levelColor } from '../lib/config';
import DocRow from '../components/DocRow';
import { BodyAd } from '../components/Ads';
import Icon from '../components/Icon';
import { ListSk } from '../components/Skeletons';

const DOC_FIELDS = 'id,title,kind,session,size_bytes,created_at,courses(code,title,level)';

export default function Home() {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(null);
  const [found, setFound] = useState(null);
  const [counts, setCounts] = useState(null);
  const [total, setTotal] = useState(null);

  useEffect(() => {
    supabase.from('documents').select(DOC_FIELDS).order('created_at', { ascending: false }).limit(8).then(({ data }) => setRecent(data || []));
    supabase.from('courses').select('level').then(({ data }) => {
      const c = {};
      (data || []).forEach((r) => { c[r.level] = (c[r.level] || 0) + 1; });
      setCounts(c);
    });
    supabase.from('documents').select('id', { count: 'exact', head: true }).then(({ count }) => setTotal(count || 0));
    try {
      if (sessionStorage.getItem('focusSearch')) {
        sessionStorage.removeItem('focusSearch');
        setTimeout(() => document.getElementById('q')?.focus(), 150);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const term = q.trim().replace(/[,()%*]/g, '');
    if (term.length < 2) { setFound(null); return; }
    let live = true;
    const t = setTimeout(async () => {
      const [d, c] = await Promise.all([
        supabase.from('documents').select(DOC_FIELDS).ilike('title', `%${term}%`).limit(20),
        supabase.from('courses').select('id,code,title,level').or(`code.ilike.%${term}%,title.ilike.%${term}%`).limit(10),
      ]);
      if (live) setFound({ docs: d.data || [], courses: c.data || [] });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  return (
    <>
      <section className="hero">
        <div className="pill rv"><i />{total === null ? 'Counting files...' : `${total.toLocaleString()} ${total === 1 ? 'file' : 'files'} shared by your set`}</div>
        <h1 className="rv" style={{ '--d': 1 }}>Every past question, one tap away.</h1>
        <p className="sub rv" style={{ '--d': 2 }}>Notes, handouts and past questions for {SITE.department}, organised by level.</p>
        <div className="search rv" style={{ '--d': 3 }}>
          <Icon name="search" />
          <input id="q" type="search" placeholder="Search a course code or title" value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Search the library" />
        </div>
      </section>

      {found ? (
        <section>
          {found.courses.length > 0 && (
            <>
              <h2 className="sec">Courses</h2>
              {found.courses.map((c, i) => (
                <Link key={c.id} href={`/course/${c.id}`} className="item rv" style={{ '--lv': levelColor(c.level), '--d': i }}>
                  <span className="tile">{c.code.split(' ')[0]}</span>
                  <span className="im"><span className="it">{c.code}</span><br /><span className="is">{c.title}, {c.level} level</span></span>
                  <span className="dot" />
                </Link>
              ))}
            </>
          )}
          <h2 className="sec">Files</h2>
          {found.docs.length === 0 && <p className="muted">No files match that search.</p>}
          {found.docs.map((d, i) => <DocRow key={d.id} d={d} i={i} />)}
        </section>
      ) : (
        <>
          <h2 className="sec rv" style={{ '--d': 3 }}>Pick your level</h2>
          <div className="levels">
            {SITE.levels.map((l, i) => (
              <Link key={l} href={`/level/${l}`} className="lvl rv" style={{ '--lv': levelColor(l), '--d': i + 4 }}>
                <b>{l}</b>
                <span>level</span>
                <em>{counts === null ? '\u00a0' : `${counts[l] || 0} ${(counts[l] || 0) === 1 ? 'course' : 'courses'}`}</em>
              </Link>
            ))}
          </div>

          <BodyAd />

          <h2 className="sec">Recently added</h2>
          {recent === null && <ListSk rows={3} />}
          {recent && recent.length === 0 && <p className="muted">No files have been added yet.</p>}
          {recent && recent.map((d, i) => <DocRow key={d.id} d={d} i={i} />)}
        </>
      )}
    </>
  );
}
