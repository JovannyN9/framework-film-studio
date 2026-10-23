/* Entry for /collaborators (collaborators/index.html) */
import { CollabApp } from './components/Collab.js';
import { html, useEffect } from './lib.js';
import { pageReady } from './site.js';

function App(){
  useEffect(()=>{ pageReady(); },[]);
  return html`<${CollabApp}/>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
