/* Site-level routing + the curtain transition between pages.
   Pages are real files (index.html, work/index.html, collaborators/index.html), so every URL loads directly
   and survives refresh. Paths are built from this file's location, so they work from any depth and host.

   Curtain contract
   - Every page's <head> paints a black canvas before any CSS arrives and, when the visitor arrives through
     the curtain OR through Back/Forward, starts with html.curtain-closed (see the inline script in each HTML).
   - go(): panels close; we navigate on the panels' own transitionend, i.e. only once the screen is fully black.
   - pageReady(): called from the page's first React commit. Restores scroll (Back/Forward) or the #hash
     while still covered, waits for webfonts so nothing reflows on reveal, then parts the curtain. */
import { jump, reduced } from './lib.js';

export const ROOT = new URL('../', import.meta.url).href;          // folder that holds index.html
export const asset = p => ROOT + p;
export const HREF = { home: ROOT, work: ROOT + 'work/', collab: ROOT + 'collaborators/' };
const rootEl = document.getElementById('root');
export const PAGE = (rootEl && rootEl.dataset.page) || 'home';

const KEY = 'fw-curtain';
const SCROLL_KEY = 'fw-scroll:' + location.pathname;
const html_ = document.documentElement;
const store = {
  get(k){ try{ return sessionStorage.getItem(k); }catch(_){ return null; } },
  set(k,v){ try{ sessionStorage.setItem(k,v); }catch(_){} },
  del(k){ try{ sessionStorage.removeItem(k); }catch(_){} }
};
const navType = (()=>{ try{ return performance.getEntriesByType('navigation')[0].type; }catch(_){ return 'navigate'; } })();

// We restore scroll ourselves, under the curtain. The browser's own restoration happens late and in view —
// on the homepage that meant landing on the light "Selected Work" section after the page had already shown.
if('scrollRestoration' in history) history.scrollRestoration = 'manual';
addEventListener('pagehide', ()=>store.set(SCROLL_KEY, String(Math.round(scrollY))));

let revealed = false, revealCbs = [], leaving = false;

export function go(href, e){
  if(e){
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;   // let new-tab clicks through
    e.preventDefault();
  }
  if(leaving) return;
  store.set(KEY, '1');
  if(reduced()){ location.href = href; return; }
  leaving = true;
  const panel = document.querySelector('.curtain .cp.r');
  let done = false;
  const navigate = ()=>{ if(done) return; done = true; location.href = href; };
  if(panel){
    panel.addEventListener('transitionend', ev=>{ if(ev.propertyName === 'transform') navigate(); }, { once:true });
  }
  html_.classList.add('curtain-closed');
  setTimeout(navigate, 1200);            // safety net only, if transitionend never fires (tab hidden, etc.)
}

function fireReveal(delay = 0){
  if(revealed) return; revealed = true;
  setTimeout(()=>{ revealCbs.forEach(cb=>cb()); revealCbs = []; }, delay);
}
/* run cb once the page is visible (curtain opening, or immediately if there was none) */
export function onReveal(cb){ revealed ? cb() : revealCbs.push(cb); }

/* call once, from the page's first commit (useEffect in App) */
export function pageReady(){
  store.del(KEY);
  // position the page while it is still covered
  const saved = (navType === 'back_forward' || navType === 'reload') ? store.get(SCROLL_KEY) : null;
  if(saved !== null) window.scrollTo(0, +saved || 0);
  else if(location.hash){
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(t) t.scrollIntoView({ behavior:'auto' });
  }
  if(!html_.classList.contains('curtain-closed')){ fireReveal(); return; }
  const fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const cap = new Promise(r=>setTimeout(r, 800));          // never hold the curtain on a slow font host
  Promise.race([fonts, cap]).then(()=>{
    // two frames: the positioned page is painted under the panels before they move
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      html_.classList.remove('curtain-closed');
      fireReveal(160);
    }));
  });
}

// Back/Forward from the bfcache: the page was frozen with the curtain closed — part it again
addEventListener('pageshow', e=>{
  if(!e.persisted) return;
  leaving = false;
  store.del(KEY);
  if(html_.classList.contains('curtain-closed')){
    requestAnimationFrame(()=>requestAnimationFrame(()=>html_.classList.remove('curtain-closed')));
  }
});

/* ---------- shared navigation ---------- */
const toTop = e=>{ e.preventDefault(); window.scrollTo({ top:0, behavior: reduced() ? 'auto' : 'smooth' }); };
export function navLinks(){
  const home = PAGE === 'home', work = PAGE === 'work';
  const hasFooter = PAGE !== 'collab';
  return [
    { label:'Work',    href:HREF.work,          onClick: work ? toTop : e=>go(HREF.work, e), current: work },
    { label:'About',   href:HREF.home+'#about', onClick: home ? jump('about') : e=>go(HREF.home+'#about', e) },
    { label:'Contact', href:hasFooter ? '#contact' : HREF.home+'#contact', onClick: hasFooter ? jump('contact') : e=>go(HREF.home+'#contact', e) }
  ];
}
export const homeLink = { href: HREF.home, onClick: PAGE === 'home' ? toTop : e=>go(HREF.home, e) };
