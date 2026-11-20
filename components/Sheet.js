'use client';
import { useEffect } from 'react';

export default function Sheet({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <>
      <div className={'scrim' + (open ? ' on' : '')} onClick={onClose} />
      <section className={'sheet glass' + (open ? ' on' : '')} role="dialog" aria-modal="true" aria-label={label} aria-hidden={!open}>
        <div className="grab" />
        {open && children}
      </section>
    </>
  );
}
