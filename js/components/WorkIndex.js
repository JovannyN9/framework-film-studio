import { html, useCallback, useEffect, useRef, useState } from '../lib.js';
import { PROJECTS } from '../data.js';
import { onReveal } from '../site.js';
import { COLLAB_ENABLED, loadBackend } from '../config.js';
import { rowToCard } from '../projects.js';
import { FilmModal } from './FilmModal.js';

/* /work — the original projects (js/data.js) followed by every PUBLISHED collaborator project (Supabase).
   Rhythm: every third project runs full width in a 2.39:1 frame, the others pair up in two columns,
   so any count stays composed (1 wide · 2 paired · 1 wide · 2 paired …).
   The homepage "Selected Work" reads only js/data.js and is never affected by collaborator projects. */
export function Card({p, i, onPlay, late=false, wide}){
  const [err,setErr] = useState(false);
  const [src,setSrc] = useState(p.src);
  useEffect(()=>setSrc(p.src),[p.src]);
  const no = String(i+1).padStart(2,'0');
  const isWide = wide ?? (i % 3 === 0);
  // YouTube serves a 120px grey placeholder (not an error) when a video has no HD still: step down to hqdefault
  const onLoad = e=>{ if(p.ytFallback && src !== p.ytFallback && e.currentTarget.naturalWidth <= 120) setSrc(p.ytFallback); };
  const onError = ()=>{ if(p.ytFallback && src !== p.ytFallback) setSrc(p.ytFallback); else setErr(true); };
  return html`
    <li class=${'wk-item' + (isWide ? ' wide' : '') + (late ? ' late' : '')} style=${{'--i': late ? 0 : i}}>
      <button class="wk-card" type="button" onClick=${()=>onPlay && onPlay({...p, no})} aria-label=${'Watch film ' + no + ': ' + p.title}>
        <span class="wk-frame">
          ${err || !src ? html`<span class="img-missing">Image unavailable</span>`
                : html`<img src=${src} alt=${p.alt} loading=${i < 2 ? 'eager' : 'lazy'} decoding="async" onLoad=${onLoad} onError=${onError} />`}
          <span class="wk-watch" aria-hidden="true">Watch film <span class="arr">↗</span></span>
        </span>
        <span class="wk-cap">
          <span class="no">${no}</span>
          <span class="t">${p.title}</span>
          <span class="d">${p.d}</span>
        </span>
      </button>
    </li>`;
}

export function WorkIndex(){
  const ref = useRef(null);
  const [film,setFilm] = useState(null);
  const [extra,setExtra] = useState([]);
  const close = useCallback(()=>setFilm(null),[]);
  useEffect(()=>{ onReveal(()=>ref.current && ref.current.classList.add('is-in')); },[]);

  // published collaborator projects — only when Supabase is configured; failures leave the originals untouched
  useEffect(()=>{
    if(!COLLAB_ENABLED) return;
    let alive = true;
    loadBackend()
      .then(b=>b.listPublished())
      .then(rows=>{ if(alive) setExtra(rows.map(rowToCard)); })
      .catch(e=>console.warn('[work] collaborator projects unavailable:', e.message));
    return ()=>{ alive = false; };
  },[]);

  const all = PROJECTS.concat(extra);
  const count = String(all.length).padStart(2,'0');
  return html`
    <main class="wk" id="work" ref=${ref}>
      <header class="wk-head wrap">
        <div class="wk-meta"><span class="eyebrow">Index / Work</span><span class="eyebrow">${count} Projects</span></div>
        <h1 class="display wk-title"><span class="mask"><span>Our work</span></span></h1>
        <p class="wk-sub">A collection of stories told through moving images.</p>
      </header>
      <ul class="wk-grid wrap">
        ${all.map((p,i)=>html`<${Card} key=${p.slug} p=${p} i=${i} onPlay=${setFilm} late=${i >= PROJECTS.length} />`)}
      </ul>
      <${FilmModal} film=${film} onClose=${close} />
    </main>`;
}
