/* Shared helpers: easing, scroll loop, reveal-on-view, smooth jump, timecode. */
// React, ReactDOM and htm arrive as globals from the CDN <script> tags in index.html.
export const { useEffect, useRef, useState, useCallback } = window.React;
export const html = window.htm.bind(window.React.createElement);
export const FPS = 24;
export const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const easeOut = t=>1-Math.pow(1-t,3);
export const easeInOut = t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Scroll-driven loop: runs rAF only while the section is near the viewport AND something moved.
   step() returns true when it needs another frame (e.g. video still easing toward its target). Idle = zero work. */
export function scrollDriven(sec, step){
  let raf = 0, visible = false, alive = true;
  const run = ()=>{ raf = 0; if(alive && step()) kick(); };
  const kick = ()=>{ if(alive && visible && !raf) raf = requestAnimationFrame(run); };
  const io = new IntersectionObserver(es=>{ visible = es[es.length-1].isIntersecting; if(visible) kick(); }, {rootMargin:'50% 0px 50% 0px'});
  io.observe(sec);
  addEventListener('scroll', kick, {passive:true});
  addEventListener('resize', kick, {passive:true});
  return { kick, stop(){ alive = false; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('scroll',kick); removeEventListener('resize',kick); } };
}

export function tc(t){
  const f = Math.round(t*FPS);
  const ff = f%FPS, s = Math.floor(f/FPS)%60, m = Math.floor(f/FPS/60);
  const p = n=>String(n).padStart(2,'0');
  return `00:${p(m)}:${p(s)}:${p(ff)}`;
}

/* ---------- shared: reveal once on viewport entry ---------- */
export function useReveal(selector, opts={}){
  const ref = useRef(null);
  useEffect(()=>{
    const root = ref.current; if(!root) return;
    const els = selector ? root.querySelectorAll(selector) : [root];
    if(reduced() || !('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries=>{
      entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} });
    },{threshold:opts.threshold ?? 0.18, rootMargin:opts.rootMargin ?? '0px 0px -6% 0px'});
    els.forEach(e=>io.observe(e));
    return ()=>io.disconnect();
  },[]);
  return ref;
}

export function jump(id){
  return (e)=>{ e.preventDefault(); const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:reduced()?'auto':'smooth'}); };
}
