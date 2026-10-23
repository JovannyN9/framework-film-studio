import { html, useEffect, useRef, useState } from '../lib.js';

/* Fullscreen film player for the Selected Work images.
   The YouTube iframe is created only when a film opens and destroyed the moment it closes,
   which stops playback completely. Page scroll position is never touched. */
const embedURL = id =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

export function FilmModal({ film, onClose }){
  const [phase, setPhase] = useState('closed');   // closed → open → closing → closed
  const [current, setCurrent] = useState(null);
  const rootRef = useRef(null), closeRef = useRef(null), returnFocus = useRef(null);

  // open / close transitions
  useEffect(()=>{
    if(film){
      returnFocus.current = document.activeElement;
      setCurrent(film);
      setPhase('mounting');
      const r = requestAnimationFrame(()=>requestAnimationFrame(()=>setPhase('open')));
      return ()=>cancelAnimationFrame(r);
    }
    if(phase === 'open' || phase === 'mounting'){
      setPhase('closing');
      const t = setTimeout(()=>{
        setPhase('closed'); setCurrent(null);
        const el = returnFocus.current;
        if(el && el.focus) el.focus({ preventScroll:true });
      }, 450);
      return ()=>clearTimeout(t);
    }
  },[film]);

  // while open: lock page scroll (position kept), Escape closes, focus stays inside the dialog
  useEffect(()=>{
    if(phase !== 'open') return;
    const html_ = document.documentElement;
    const prevOverflow = html_.style.overflow;
    html_.style.overflow = 'hidden';
    closeRef.current && closeRef.current.focus({ preventScroll:true });
    const onKey = e=>{ if(e.key === 'Escape'){ e.preventDefault(); onClose(); } };
    const onFocus = e=>{ if(rootRef.current && !rootRef.current.contains(e.target)) closeRef.current && closeRef.current.focus({ preventScroll:true }); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return ()=>{
      html_.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
    };
  },[phase]);

  if(phase === 'closed' || !current) return null;
  const live = phase === 'open' || phase === 'mounting';   // iframe exists only while open

  return html`
    <div class=${'film-modal' + (phase === 'open' ? ' is-open' : '')} ref=${rootRef}
         role="dialog" aria-modal="true" aria-label=${'Film: ' + current.title}
         onClick=${e=>{ if(e.target === e.currentTarget) onClose(); }}>
      <button class="film-close" type="button" ref=${closeRef} onClick=${onClose} aria-label="Close film">
        <span class="eyebrow">Close</span><span class="x" aria-hidden="true"></span>
      </button>
      <div class="film-stage" onClick=${e=>{ if(e.target === e.currentTarget) onClose(); }}>
        <div class="film-frame">
          ${live && html`<iframe
              src=${embedURL(current.yt)}
              title=${current.title + ' — FRAMEWORK'}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"></iframe>`}
        </div>
        <div class="film-meta">
          <span class="film-info"><span class="eyebrow">${current.no} — ${current.title}</span>${current.description && html`<span class="film-desc">${current.description}</span>`}</span>
          <a class="film-fallback" href=${'https://youtu.be/' + current.yt} target="_blank" rel="noopener">Player not loading? Watch on YouTube ↗</a>
        </div>
      </div>
    </div>`;
}
