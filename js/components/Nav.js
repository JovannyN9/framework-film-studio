import { html } from '../lib.js';
import { navLinks, homeLink } from '../site.js';

export function Nav(){
  return html`
    <header class="nav wrap">
      <a class="wordmark" href=${homeLink.href} onClick=${homeLink.onClick}>Framework</a>
      <nav aria-label="Primary"><ul>
        ${navLinks().map(l=>html`<li key=${l.label}><a class="link" href=${l.href} onClick=${l.onClick} aria-current=${l.current ? 'page' : null}>${l.label}</a></li>`)}
      </ul></nav>
    </header>`;
}
