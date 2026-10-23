import { clamp, easeInOut, easeOut, html, reduced, scrollDriven, useEffect, useRef, useState } from '../lib.js';

// src = vertical (phones, ≤767px) · wide = landscape 16:9 (tablets and desktop, ≥768px)
const SEQ = [
  {src:'media/seq-01.jpg', wide:'media/seq-01-wide', alt:'Macro beauty shot: gold and gemstone rings stacked on a silver fork held between glossy lips'},
  {src:'media/seq-02.jpg', wide:'media/seq-02-wide', alt:'Woman with closed eyes holding a perfume bottle as rose petals drift through warm light'},
  {src:'media/seq-03.jpg', wide:'media/seq-03-wide', alt:'Man in a tuxedo adjusting his bow tie, a rose-gold chronograph on his wrist'}
];
const SEQ_COPY = [
  null,
  {cls:'c2', lines:['We turn ideas','into impact.']},
  {cls:'c3', lines:['Stories that','stay with you.']}
];
// Each plate owns one third of the timeline: push-in over the first 70%, full-bleed hold for the rest.
const MOVE = 0.70;
const easeCam = t=>t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;   // slow off the mark, settles into frame
const lerp = (a,b,t)=>a+(b-a)*t;

export function Sequence(){
  const secRef = useRef(null);
  const plateRefs = useRef([]), imgRefs = useRef([]), veilRefs = useRef([]);
  const copyLineRefs = useRef([]), scrimRefs = useRef([]);
  const [missing,setMissing] = useState({});

  useEffect(()=>{
    if(reduced()) return;
    const sec = secRef.current; let last = -1, lastVh = 0;

    const render = (p, vh)=>{
      const seg = 1/SEQ.length;
      const local = SEQ.map((_,i)=>clamp((p - i*seg)/seg));   // 0..1 per plate
      SEQ.forEach((_,i)=>{
        const el = plateRefs.current[i], img = imgRefs.current[i], veil = veilRefs.current[i];
        if(!el) return;
        const m = clamp(local[i]/MOVE);
        // position: centre travels from just below the frame (top edge at 100vh while at 0.4 scale) to dead centre
        const ym = easeOut(m);
        const y = lerp(vh*0.70, 0, ym);
        // scale lags the rise slightly so the plate arrives at 40% before it starts to grow: reads as dolly, not zoom
        const sm = easeCam(clamp((m-0.08)/0.92));
        const s = lerp(0.4, 1, sm);
        el.style.transform = `translate3d(0,${y.toFixed(2)}px,0) scale(${s.toFixed(5)})`;
        // the picture inside counter-drifts a touch: depth inside the frame as it approaches
        if(img) img.style.transform = `scale(${lerp(1.18,1,sm).toFixed(5)})`;
        // the plate underneath sinks into shadow as the next one covers it
        const next = local[i+1];
        if(veil) veil.style.opacity = next===undefined ? '0' : (easeOut(clamp(next/MOVE))*0.55).toFixed(3);
      });

      // typography for plates 2 and 3
      [1,2].forEach(i=>{
        const lines = copyLineRefs.current[i] || [];
        const l = local[i];
        // enter once the plate is ~75% through its push-in, finish as it locks full-bleed
        const enterStart = MOVE*0.75, enterEnd = MOVE*1.02;
        let exit = 0;
        if(i===1) exit = easeInOut(clamp(local[2]/0.2));              // leaves as plate 3 rises
        else exit = easeInOut(clamp((l-0.9)/0.1));                       // final title releases at the end of the pin
        let vis = 0;
        lines.forEach((el,j)=>{
          if(!el) return;
          const e = easeOut(clamp((l - enterStart - j*0.035)/(enterEnd-enterStart)));
          vis = Math.max(vis,e);
          const y = (1-e)*110 - exit*110;
          el.style.transform = `translate3d(0,${y.toFixed(2)}%,0)`;
          el.style.opacity = (e*(1-exit)).toFixed(3);
        });
        const sc = scrimRefs.current[i];
        if(sc) sc.style.opacity = (vis*(1-exit)).toFixed(3);
      });
    };

    /* ── SMOOTHNESS ─────────────────────────────────────────────
       The plates don't jump to the scroll position; they glide toward it.
       SMOOTH = how quickly they catch up (per second).
         lower  → calmer, floatier, more delay behind the scroll (try 2)
         higher → tighter, follows the finger/wheel closely      (try 6)
       The section's length (how much scrolling per image) is .seq{height} in css/styles.css. */
    const SMOOTH = 3;
    let shown = -1, lastT = 0;
    const tick = ()=>{
      const r = sec.getBoundingClientRect(), vh = window.innerHeight;
      const target = clamp(-r.top/Math.max(1, r.height - vh));
      const now = performance.now();
      const dt = lastT ? Math.min(0.05, (now - lastT)/1000) : 1/60;   // same feel at 60Hz and 120Hz
      lastT = now;
      if(shown < 0 || Math.abs(target - shown) > 0.5) shown = target;   // first frame / far jumps (nav links): snap
      else shown += (target - shown)*(1 - Math.exp(-SMOOTH*dt));
      const settled = Math.abs(target - shown) < 0.0004;
      if(settled) shown = target;
      if(Math.abs(shown-last) > 1e-5 || vh!==lastVh){ last = shown; lastVh = vh; render(shown, vh); }
      if(settled) lastT = 0;
      return !settled;   // keep gliding after the scroll stops, then go idle
    };
    render(0, window.innerHeight);
    tick();
    const loop = scrollDriven(sec, tick);
    return ()=>loop.stop();
  },[]);

  return html`
    <section class="seq" ref=${secRef} aria-label="Frame sequence">
      <div class="seq-pin">
        ${SEQ.map((it,i)=>html`
          <div key=${i} class=${'plate p'+(i+1)} style=${{zIndex:i+1}} ref=${el=>plateRefs.current[i]=el}>
            ${missing[i] ? html`<span class="missing">Image ${String(i+1).padStart(2,'0')} unavailable</span>`
              : html`<picture>
                  <source media="(min-width: 768px)" type="image/webp" srcSet=${it.wide + '.webp'} />
                  <source media="(min-width: 768px)" srcSet=${it.wide + '.jpg'} />
                  <img ref=${el=>imgRefs.current[i]=el} src=${it.src} alt=${it.alt} decoding="async" fetchpriority="low" onError=${()=>setMissing(m=>({...m,[i]:true}))} />
                </picture>`}
            <div class="veil" ref=${el=>veilRefs.current[i]=el}></div>
          </div>`)}
        ${SEQ_COPY.map((c,i)=>c && html`
          <div key=${'c'+i} class=${'seq-copy '+c.cls} style=${{zIndex:10+i}}>
            <div class="scrim" ref=${el=>scrimRefs.current[i]=el}></div>
            <h2 class="display">${c.lines.map((ln,j)=>html`<span key=${j} class="line"><span ref=${el=>{(copyLineRefs.current[i] ||= [])[j]=el}}>${ln}</span></span>`)}</h2>
          </div>`)}
      </div>
    </section>`;
}
