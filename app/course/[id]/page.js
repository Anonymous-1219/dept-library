'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { semesterName, levelColor } from '../../../lib/config';
import { useAuth } from '../../../components/AuthProvider';
import DocRow from '../../../components/DocRow';
import { ListSk, PageSk } from '../../../components/Skeletons';

export default function CoursePage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [course, setCourse] = useState(undefined);
  const [docs, setDocs] = useState(null);

  useEffect(() => {
    supabase.from('courses').select('*').eq('id', id).maybeSingle().then(({ data }) => setCourse(data || null));
    supabase.from('documents').select('id,title,kind,session,size_bytes,created_at')
      .eq('course_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setDocs(data || []));
  }, [id]);

  if (course === undefined) return <PageSk />;
  if (course === null) return <p>This course does not exist. <Link href="/">Back to the library</Link></p>;

  const canUpload = profile && ['rep', 'admin', 'owner'].includes(profile.role);
  return (
    <div style={{ '--lv': levelColor(course.level) }}>
      <p className="crumb"><Link href={`/level/${course.level}`}>{course.level} level</Link></p>
      <h1 className="pg">{course.code}</h1>
      <p className="lede">{course.title}, {semesterName(course.semester).toLowerCase()}</p>
      {canUpload && <p style={{ marginBottom: 18 }}><Link className="btn ghost" href={`/upload?course=${course.id}`}>Add a file to this course</Link></p>}
      {docs === null && <ListSk rows={3} />}
      {docs && docs.length === 0 && <p className="muted">No files have been added to this course yet.</p>}
      {docs && docs.map((d, i) => <DocRow key={d.id} d={d} i={i} />)}
    </div>
  );
}
