import { clamp, html, reduced, scrollDriven, useEffect, useRef } from '../lib.js';
import { VISION } from '../data.js';

export function Vision(){
  const secRef = useRef(null), countRef = useRef(null);
  const words = VISION.split(' ');
  const wordRefs = useRef([]);
  useEffect(()=>{
    if(reduced()){ if(countRef.current) countRef.current.textContent = `${words.length}/${words.length}`; return; }
    const sec = secRef.current; let lastShown=-1;
    const from=[0xCF,0xCB,0xC3], to=[0x0B,0x0B,0x0B];
    const tick=()=>{
      const r = sec.getBoundingClientRect(), vh = window.innerHeight;
      const p = clamp(-r.top/Math.max(1,r.height-vh));
      const q = clamp((p-0.04)/0.82)*words.length;   // full reveal before the pin releases
      let count=0;
      wordRefs.current.forEach((el,i)=>{
        if(!el) return;
        const k = clamp(q - i);
        if(k>0.5) count++;
        const prev = el._k;
        if(prev!==k){
          el._k = k;
          const c = from.map((f,n)=>Math.round(f+(to[n]-f)*k));
          el.style.color = `rgb(${c[0]},${c[1]},${c[2]})`;
        }
      });
      if(count!==lastShown && countRef.current){ lastShown=count; countRef.current.textContent = `${String(count).padStart(2,'0')}/${words.length}`; }
      return false;
    };
    tick();
    const loop = scrollDriven(sec, tick);
    return ()=>loop.stop();
  },[]);
  return html`
    <section class="vision" id="about" ref=${secRef} aria-labelledby="vision-h">
      <div class="vision-pin wrap">
        <div class="vision-head"><span class="eyebrow" id="vision-h">01 / Our Vision</span><span class="eyebrow count" ref=${countRef} aria-hidden="true">00/${words.length}</span></div>
        <p class="vision-text">${words.map((w,i)=>html`<span key=${i} class="w" ref=${el=>wordRefs.current[i]=el}>${w}</span>${i<words.length-1?' ':''}`)}</p>
      </div>
    </section>`;
}
