import { Nav } from './components/Nav.js';
import { Intro } from './components/Intro.js';
import { VideoReel } from './components/VideoReel.js';
import { Vision } from './components/Vision.js';
import { Work } from './components/Work.js';
import { Sequence } from './components/Sequence.js';
import { Approach } from './components/Approach.js';
import { Footer } from './components/Footer.js';
import { html, useEffect } from './lib.js';
import { pageReady } from './site.js';

function App(){
  useEffect(()=>{ pageReady(); },[]);   // first commit: page is in the DOM, curtain may part
  return html`<${React.Fragment}>
    <${Nav}/><main><${Intro}/><${VideoReel}/><${Vision}/><${Work}/><${Sequence}/><${Approach}/></main><${Footer}/>
  </${React.Fragment}>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
