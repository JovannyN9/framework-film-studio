import { html, useCallback, useReveal, useState } from '../lib.js';
import { ASSETS } from '../data.js';
import { FilmModal } from './FilmModal.js';
import { HREF, go } from '../site.js';

function Shot({item,i,onPlay}){
  const [err,setErr] = useState(false);
  const no = String(i+1).padStart(2,'0');
  return html`
    <figure class=${'shot reveal g'+(i+1)} style=${{'--delay':(i===2?0.18:i*0.08)+'s'}}>
      <div class="frame">
        ${err ? html`<span class="img-missing">Image unavailable</span>`
              : html`<img src=${item.src} alt=${item.alt} loading="lazy" decoding="async" onError=${()=>setErr(true)} />`}
        ${item.yt && html`
          <button class="watch" type="button" onClick=${()=>onPlay({...item, no})} aria-label=${'Watch film ' + no + ': ' + item.title}>
            <span class="watch-tag" aria-hidden="true">Watch film <span class="arr">↗</span></span>
          </button>`}
      </div>
      <figcaption><span class="no">${no}</span><span class="t">${item.title}</span><span class="d">${item.d}</span></figcaption>
    </figure>`;
}
export function Work(){
  const ref = useReveal('.reveal, .mask',{threshold:0.12});
  const [film,setFilm] = useState(null);
  const close = useCallback(()=>setFilm(null),[]);
  return html`
    <section class="work" id="work" ref=${ref} aria-labelledby="work-h">
      <div class="wrap">
        <div class="work-head">
          <span class="eyebrow">02 / Selected Work</span>
          <h2 class="display" id="work-h"><span class="mask"><span>Stories worth</span></span><span class="mask" style=${{'--delay':'.08s'}}><span>telling.</span></span></h2>
          <p class="reveal" style=${{'--delay':'.2s'}}>A selection of moments we've brought to life.</p>
        </div>
        <div class="gallery">${ASSETS.work.map((it,i)=>html`<${Shot} key=${i} item=${it} i=${i} onPlay=${setFilm} />`)}</div>
        <div class="view-all reveal">
          <a class="cta cta-ink" href=${HREF.work} onClick=${e=>go(HREF.work, e)}>View all projects <span class="arr" aria-hidden="true">↗</span></a>
        </div>
      </div>
      <${FilmModal} film=${film} onClose=${close} />
    </section>`;
}
