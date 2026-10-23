import { FPS, clamp, easeInOut, easeOut, html, reduced, scrollDriven, tc, useEffect, useRef, useState } from '../lib.js';
import { ASSETS, MOBILE_Q, STATEMENTS, WINDOWS } from '../data.js';

export function VideoReel(){
  const secRef = useRef(null), videoRef = useRef(null), mediaRef = useRef(null), tcRef = useRef(null), frRef = useRef(null);
  const lineRefs = useRef([]);
  const [note,setNote] = useState(null);
  const [hasVideo,setHasVideo] = useState(false);

  useEffect(()=>{
    const sec = secRef.current, v = videoRef.current, media = mediaRef.current;
    let alive = true, ready = false, duration = 0, shown = 0, objectURL = null, loop = null, lastP = -1, lastVh = 0, lastT = 0;
    let lastTC = '';
    const isReduced = reduced();

    const fail = (msg)=>{ if(!alive) return; setHasVideo(false); setNote(msg); };

    // ---- load: fetch whole file into a Blob so every frame is seekable without range requests
    const canMp4 = v.canPlayType('video/mp4; codecs="avc1.64001F"') || v.canPlayType('video/mp4');
    if(!canMp4){ fail('This browser cannot decode H.264 MP4, so the hero shows a still frame instead of the scrubbed film.'); }
    else {
      const ctrl = new AbortController();
      let timeout = 0, started = false, startIO = null;
      // The image hero above loads first; the film starts downloading once the page has loaded
      // or as soon as this section is within ~1.5 screens — whichever comes first.
      const start = ()=>{
        if(started || !alive) return; started = true;
        if(startIO) startIO.disconnect();
        removeEventListener('load', start);
        timeout = setTimeout(()=>{ if(!ready) fail('The film is taking too long to load. Showing a still frame for now; it will take over once it is ready.'); },12000);
        fetch(ASSETS.video,{signal:ctrl.signal})
          .then(r=>{ if(!r.ok) throw new Error(r.status); return r.blob(); })
          .then(b=>{ if(!alive) return; objectURL = URL.createObjectURL(b); v.src = objectURL; v.load(); })
          .catch(err=>{ if(!alive || err.name==='AbortError') return; v.src = ASSETS.video; v.load(); });
      };
      if(document.readyState === 'complete') start();
      else {
        addEventListener('load', start);
        startIO = new IntersectionObserver(es=>{ if(es[es.length-1].isIntersecting) start(); }, {rootMargin:'150% 0px 150% 0px'});
        startIO.observe(sec);
      }

      const onMeta = ()=>{
        duration = v.duration;
        if(!isFinite(duration) || duration<=0){ fail('The video reported no usable duration, so it cannot be mapped to scroll.'); return; }
        const check = ()=>{
          if(!alive) return;
          if(v.seekable && v.seekable.length && v.seekable.end(0) > 0){
            ready = true; clearTimeout(timeout); setNote(null); setHasVideo(true);
            // iOS paints nothing until the element has played once
            const p = v.play(); if(p && p.then) p.then(()=>v.pause()).catch(()=>{});
            v.pause();
            if(loop) loop.kick();
          } else setTimeout(check,120);
        };
        check();
      };
      const onErr = ()=>fail('The hero film could not be decoded (file missing or unsupported encoding). Showing a still frame instead of autoplaying.');
      v.addEventListener('loadedmetadata',onMeta);
      v.addEventListener('error',onErr);

      var cleanupLoad = ()=>{ ctrl.abort(); clearTimeout(timeout); removeEventListener('load', start); if(startIO) startIO.disconnect(); v.removeEventListener('loadedmetadata',onMeta); v.removeEventListener('error',onErr); };
    }

    // ---- scroll-driven step (one layout read per frame, writes only)
    const onSeeked = ()=>{ if(loop) loop.kick(); };
    v.addEventListener('seeked', onSeeked);
    const step = ()=>{
      if(!alive) return false;
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = Math.max(1, r.height - vh);
      const p = isReduced ? 0 : clamp(-r.top/span);
      let more = false;

      // video scrubbing: ease toward target, seek only when off by > half a frame and the decoder is idle
      if(ready && !isReduced){
        const target = p*(duration - 1/FPS);
        // frame-rate independent glide: same feel on 60Hz and 120Hz screens.
        // SMOOTH = how fast the film catches up to the scroll (lower = softer, more "fluid" camera).
        const now = performance.now();
        const dt = lastT ? Math.min(0.05, (now - lastT)/1000) : 1/60;
        lastT = now;
        const SMOOTH = 4.5;
        shown += (target - shown)*(1 - Math.exp(-SMOOTH*dt));
        if(Math.abs(target-shown) < 0.5/FPS/4) shown = target;
        const off = Math.abs(v.currentTime - shown) > 0.5/FPS;
        if(!v.seeking && off){
          try{ v.currentTime = shown; }catch(e){}
        }
        more = shown !== target || v.seeking;
        if(!more) lastT = 0;   // next scroll starts a fresh glide   // keep easing; a 'seeked' event re-kicks if needed
        const label = tc(shown);
        if(label!==lastTC){
          lastTC = label;
          if(tcRef.current) tcRef.current.textContent = label;
          if(frRef.current) frRef.current.textContent = String(Math.min(Math.round(shown*FPS)+1, Math.round(duration*FPS))).padStart(3,'0');
        }
      }
      if(p===lastP && vh===lastVh && !more) return false;
      lastP = p; lastVh = vh;

      // statements
      if(!isReduced){
        WINDOWS.forEach(([a,b],i)=>{
          const l = clamp((p-a)/(b-a));
          const last = i===WINDOWS.length-1;
          const exit = last ? 0 : easeInOut(clamp((l-0.74)/0.26));
          (lineRefs.current[i]||[]).forEach((el,j)=>{
            if(!el) return;
            const enter = easeOut(clamp((l - j*0.07)/0.3));
            const y = (1-enter)*110 - exit*110;
            el.style.transform = `translate3d(0,${y.toFixed(2)}%,0)`;
            el.style.opacity = (enter*(1-exit*0.5)).toFixed(3);
          });
        });
        sec.style.setProperty('--hp', p.toFixed(4));
        sec.style.setProperty('--dim', (0.18 + p*0.22).toFixed(3));
        // letterbox closes toward 2.39:1 as the sequence ends
        const w = window.innerWidth, target = Math.max(0,(vh - w/2.39)/2);
        sec.style.setProperty('--lb', (easeInOut(clamp((p-0.68)/0.32))*target).toFixed(1)+'px');
      }
      return more;
    };
    step();
    loop = scrollDriven(sec, step);

    return ()=>{
      alive = false; loop.stop(); v.removeEventListener('seeked', onSeeked);
      if(typeof cleanupLoad==='function') cleanupLoad();
      if(objectURL) URL.revokeObjectURL(objectURL);
    };
  },[]);

  return html`
    <section class="hero" id="reel" ref=${secRef} aria-label="Showreel">
      <div class="hero-pin">
        <div class=${'hero-media'+(hasVideo?' has-video':'')} ref=${mediaRef}>
          <video ref=${videoRef} muted playsInline preload="auto" poster=${ASSETS.poster} aria-hidden="true" tabIndex="-1" disablePictureInPicture></video>
          <picture>
            <source media=${MOBILE_Q} srcSet="media/poster-mobile.webp" type="image/webp" />
            <source media=${MOBILE_Q} srcSet="media/poster-mobile.jpg" />
            <source srcSet="media/poster.webp" type="image/webp" />
            <img src="media/poster.jpg" alt="" aria-hidden="true" fetchpriority="low" decoding="async" />
          </picture>
        </div>
        <div class="shade"></div>
        <div class="letterbox top"></div><div class="letterbox bot"></div>

        <div class="statements">
          ${STATEMENTS.map((s,i)=>html`
            <h2 key=${i} class=${'statement display '+s.cls}>
              ${s.lines.map((ln,j)=>html`<span key=${j} class="line"><span ref=${el=>{(lineRefs.current[i] ||= [])[j]=el}}>${ln}</span></span>`)}
            </h2>`)}
        </div>

        <div class="hud wrap">
          <div class="l"><span class="eyebrow">Independent Film Studio — Los Angeles</span></div>
          <div class="scroll-ind" aria-hidden="true"><span class="eyebrow">Scroll</span><span class="track"><span class="fill"></span></span></div>
          <div class="r tc" aria-hidden="true">TC <b ref=${tcRef}>00:00:00:00</b> · FR <b ref=${frRef}>001</b>/240</div>
        </div>
        ${note && html`<p class="media-note" role="status">${note}</p>`}
      </div>
    </section>`;
}
