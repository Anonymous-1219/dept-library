import Link from 'next/link';
import { fmtSize, levelColor } from '../lib/config';

export default function DocRow({ d, i = 0 }) {
  const sub = [d.courses?.code, d.kind, d.session].filter(Boolean).join(', ');
  const lv = d.courses?.level ? levelColor(d.courses.level) : null;
  const style = { '--d': i, ...(lv ? { '--lv': lv } : {}) };
  return (
    <Link href={`/doc/${d.id}`} className="item rv" style={style}>
      <span className="tile">PDF</span>
      <span className="im">
        <span className="it">{d.title}</span><br />
        <span className="is">{sub}</span>
      </span>
      <span className="meta-r">{fmtSize(d.size_bytes)}</span>
      <span className="dot" />
    </Link>
  );
}
