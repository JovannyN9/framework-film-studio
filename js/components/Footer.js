import { html, reduced, useCallback, useReveal, useState } from '../lib.js';
import { navLinks, HREF, go } from '../site.js';
import { COLLAB_ENABLED } from '../config.js';

export function Footer(){
  const ref = useReveal('.mask, .reveal',{threshold:0.15});
  const [copied,setCopied] = useState('');
  const email = 'hello@framework.studio';
  const copy = useCallback((e)=>{
    const btn = e.currentTarget;
    const done = ()=>{ setCopied('Copied'); setTimeout(()=>setCopied(''),1800); };
    const fallback = ()=>{ const s = btn.previousElementSibling; const r = document.createRange(); r.selectNodeContents(s); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); setCopied('Selected — press ⌘C'); setTimeout(()=>setCopied(''),2400); };
    try{ navigator.clipboard.writeText(email).then(done,fallback); }catch(_){ fallback(); }
  },[]);
  const toTop = ()=>window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'});
  return html`
    <footer class="footer wrap" id="contact" ref=${ref}>
      <div>
        <div class="card-top"><span class="eyebrow">Have a story in mind?</span><span class="eyebrow" aria-hidden="true">END · 00:00:10:00</span></div>
        <h2 class="display">
          <span class="mask"><span>Let's make</span></span>
          <span class="mask" style=${{'--delay':'.1s'}}><span>it real.</span></span>
        </h2>
        <div class="cta-row reveal" style=${{'--delay':'.25s'}}>
          <a class="cta" href=${'mailto:'+email}>Start a project <span class="arr" aria-hidden="true">↗</span></a>
          <div class="email"><span>${email}</span><button type="button" onClick=${copy}>Copy</button>${copied && html`<span class="toast" role="status">${copied}</span>`}</div>
        </div>
      </div>
      <div class="foot-grid">
        <div><span class="eyebrow">Studio</span>FRAMEWORK<br/>Los Angeles, California</div>
        <nav class="foot-nav" aria-label="Footer"><span class="eyebrow">Index</span>
          ${navLinks().map(l=>html`<a key=${l.label} href=${l.href} onClick=${l.onClick}>${l.label}</a>`)}</nav>
        <div class="foot-nav"><span class="eyebrow">Follow</span>
          <a href="#" onClick=${e=>e.preventDefault()}>Instagram</a><span class="ph">placeholder link</span>
          <a href="#" onClick=${e=>e.preventDefault()}>Vimeo</a><span class="ph">placeholder link</span></div>
        <div style=${{display:'flex',flexDirection:'column',justifyContent:'space-between',gap:'20px',alignItems:'flex-start'}}>
          <button class="to-top" type="button" onClick=${toTop}><span class="ring" aria-hidden="true">↑</span>Back to top</button>
          <span>© ${new Date().getFullYear()} FRAMEWORK. All rights reserved.</span>
          ${COLLAB_ENABLED && html`<a class="collab-link" href=${HREF.collab} onClick=${e=>go(HREF.collab, e)}>Collaborator login</a>`}
        </div>
      </div>
    </footer>`;
}
