import { clamp, html, reduced, scrollDriven, useEffect, useRef } from '../lib.js';
import { INTRO } from '../data.js';

/* Section 1 — image hero. Not pinned.
   Load: image unmasks bottom-up while settling from a slight push-in; headline lines rise out of their masks;
   supporting copy and scroll cue fade in after. Scroll: the photograph drifts slower than the page (parallax)
   and the copy lifts away, handing off to the pinned film below. */
export function Intro(){
  const secRef = useRef(null), mediaRef = useRef(null), copyRef = useRef(null), imgRef = useRef(null);

  useEffect(()=>{
    const sec = secRef.current, media = mediaRef.current, copy = copyRef.current, img = imgRef.current;
    const isReduced = reduced();

    // entrance: copy starts on the next frame; the image reveal waits for decode (with a fallback so nothing hangs)
    const raf = requestAnimationFrame(()=>sec.classList.add('copy-in'));
    let shown = false;
    const showImg = ()=>{ if(shown) return; shown = true; sec.classList.add('img-in'); };
    if(img.complete && img.naturalWidth) showImg();
    else { img.addEventListener('load', showImg); img.addEventListener('error', showImg); }
    const fallback = setTimeout(showImg, 2500);

    if(isReduced) return ()=>{ cancelAnimationFrame(raf); clearTimeout(fallback); img.removeEventListener('load', showImg); };

    // parallax over the first screen of scroll only
    let last = -1;
    const step = ()=>{
      const vh = window.innerHeight;
      const p = clamp(-sec.getBoundingClientRect().top / vh);
      if(p === last) return false;
      last = p;
      media.style.transform = `translate3d(0,${(p*vh*0.28).toFixed(1)}px,0) scale(${(1 + p*0.05).toFixed(4)})`;
      copy.style.transform = `translate3d(0,${(-p*vh*0.12).toFixed(1)}px,0)`;
      copy.style.opacity = (1 - clamp(p*1.35)).toFixed(3);
      return false;
    };
    step();
    const loop = scrollDriven(sec, step);
    return ()=>{ cancelAnimationFrame(raf); clearTimeout(fallback); img.removeEventListener('load', showImg); img.removeEventListener('error', showImg); loop.stop(); };
  },[]);

  return html`
    <section class="intro" id="top" ref=${secRef} aria-labelledby="intro-h">
      <div class="intro-media" ref=${mediaRef}>
        <picture>
          <source type="image/webp" srcSet=${INTRO.webp} sizes=${INTRO.sizes} />
          <img ref=${imgRef} src=${INTRO.jpg} srcSet=${INTRO.jpgSet} sizes=${INTRO.sizes}
               alt=${INTRO.alt} width="2560" height="1440" fetchpriority="high" decoding="async" />
        </picture>
      </div>
      <div class="intro-shade" aria-hidden="true"></div>

      <div class="intro-copy wrap" ref=${copyRef}>
        <h1 class="display intro-h" id="intro-h">
          <span class="mask"><span>We create</span></span>
          <span class="mask" style=${{'--delay':'.12s'}}><span>what you feel.</span></span>
        </h1>
        <div class="intro-foot">
          <p class="intro-sub">Independent film production studio.<br/>Crafting stories that move people.</p>
          <a class="intro-cue" href="#reel" onClick=${e=>{e.preventDefault(); document.getElementById('reel').scrollIntoView({behavior:reduced()?'auto':'smooth'});}}>
            <span class="eyebrow">Scroll</span><span class="cue-line" aria-hidden="true"><span></span></span>
          </a>
        </div>
      </div>
    </section>`;
}
