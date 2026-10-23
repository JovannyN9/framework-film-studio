import { html, useReveal } from '../lib.js';

const STAGES = [
  ['01','Concept','Every unforgettable story begins with an idea worth pursuing.','Pre'],
  ['02','Production','Crafting every shot with intention, precision, and imagination.','Set'],
  ['03','Post-Production','Where the details come together and the story finds its final form.','Suite']
];
export function Approach(){
  const ref = useReveal('.mask, .stage',{threshold:0.2});
  return html`
    <section class="approach" ref=${ref} aria-labelledby="ap-h">
      <div class="wrap">
        <p class="eyebrow">03 / Our Approach</p>
        <h2 class="display" id="ap-h">
          <span class="mask"><span>From first thought</span></span>
          <span class="mask" style=${{'--delay':'.1s'}}><span>to final frame.</span></span>
        </h2>
        <ol class="stages">
          ${STAGES.map(([n,h,p,tag],i)=>html`
            <li key=${n} class="stage">
              <div class="num fade" style=${{'--delay':i*0.12+'s'}}><span>${n}</span><i>${tag}</i></div>
              <h3 class="fade" style=${{'--delay':i*0.12+0.08+'s'}}>${h}</h3>
              <p class="fade" style=${{'--delay':i*0.12+0.16+'s'}}>${p}</p>
            </li>`)}
        </ol>
      </div>
    </section>`;
}
