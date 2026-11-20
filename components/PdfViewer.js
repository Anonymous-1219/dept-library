'use client';
import { useEffect, useRef, useState } from 'react';
import { Sk } from './Skeletons';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (window.__pdfjsPromise) return window.__pdfjsPromise;
  window.__pdfjsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CDN + 'pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error('viewer'));
    document.head.appendChild(s);
  });
  return window.__pdfjsPromise;
}

export default function PdfViewer({ url, pageLimit }) {
  const box = useRef(null);
  const [info, setInfo] = useState({ status: 'loading', total: 0, shown: 0 });

  useEffect(() => {
    let cancelled = false;
    let doc = null;
    (async () => {
      try {
        const lib = await loadPdfJs();
        // Range requests: only the parts of the file that the first pages need are fetched.
        doc = await lib.getDocument({ url, rangeChunkSize: 262144, disableAutoFetch: true }).promise;
        if (cancelled) return;
        const total = doc.numPages;
        const shown = Math.min(total, pageLimit || total);
        setInfo({ status: 'ready', total, shown });
        const el = box.current;
        el.innerHTML = '';
        const width = Math.min(el.clientWidth || 360, 900);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= shown; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          c.style.width = width + 'px';
          c.style.height = vp.height / dpr + 'px';
          c.className = 'pdf-page';
          el.appendChild(c);
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        }
      } catch (e) {
        if (!cancelled) setInfo({ status: 'error', total: 0, shown: 0 });
      }
    })();
    return () => { cancelled = true; if (doc) doc.destroy(); };
  }, [url, pageLimit]);

  return (
    <div>
      {info.status === 'loading' && <Sk h={380} r={22} />}
      {info.status === 'error' && <p className="error">The preview could not load. You can still download the file.</p>}
      <div ref={box} className="pdfbox" style={info.status === 'ready' ? undefined : { display: 'none' }} />
      {info.status === 'ready' && info.shown < info.total && <p className="muted">Showing {info.shown} of {info.total} pages.</p>}
    </div>
  );
}
