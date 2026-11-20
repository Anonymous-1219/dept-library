'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { semesterName, levelColor } from '../../../lib/config';
import { ListSk } from '../../../components/Skeletons';

export default function LevelPage() {
  const { level } = useParams();
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    setCourses(null);
    supabase.from('courses').select('id,code,title,semester,documents(count)')
      .eq('level', Number(level)).order('code')
      .then(({ data }) => setCourses(data || []));
  }, [level]);

  return (
    <div style={{ '--lv': levelColor(Number(level)) }}>
      <p className="crumb"><Link href="/">Library</Link></p>
      <div className="bignum">{level}<small>level</small></div>
      {courses === null && <div style={{ marginTop: 28 }}><ListSk rows={4} /></div>}
      {courses && courses.length === 0 && <p className="muted" style={{ marginTop: 20 }}>No courses have been added for this level yet.</p>}
      {[1, 2].map((s) => {
        const list = (courses || []).filter((c) => c.semester === s);
        if (!list.length) return null;
        return (
          <section key={s}>
            <h2 className="sec">{semesterName(s)}</h2>
            {list.map((c, i) => {
              const n = c.documents?.[0]?.count || 0;
              return (
                <Link key={c.id} href={`/course/${c.id}`} className="item rv" style={{ '--d': i }}>
                  <span className="tile">{c.code.split(' ')[0]}</span>
                  <span className="im"><span className="it">{c.code}</span><br /><span className="is">{c.title}</span></span>
                  <span className="meta-r">{n} {n === 1 ? 'file' : 'files'}</span>
                  <span className="dot" />
                </Link>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
