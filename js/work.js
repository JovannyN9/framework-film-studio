/* Entry for /work (work/index.html) */
import { Nav } from './components/Nav.js';
import { WorkIndex } from './components/WorkIndex.js';
import { Footer } from './components/Footer.js';
import { html, useEffect } from './lib.js';
import { pageReady } from './site.js';

function App(){
  useEffect(()=>{ pageReady(); },[]);
  return html`<${React.Fragment}><${Nav}/><${WorkIndex}/><${Footer}/></${React.Fragment}>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
