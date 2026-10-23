/* Content and media paths. Edit copy and assets here. */
import { asset } from './site.js';
// Mobile (≤767px) gets its own vertical hero film; desktop keeps the original. Only one is ever requested.
export const MOBILE_Q = '(max-width: 767px)';
export const SMALL = window.matchMedia(MOBILE_Q).matches;

export const ASSETS = {
  video: asset(SMALL ? 'media/hero-mobile.mp4' : 'media/hero.mp4'),
  poster: asset(SMALL ? 'media/poster-mobile.jpg' : 'media/poster.jpg'),
  work: []   // filled below from PROJECTS (featured ones, homepage order)
};

/* PROJECTS — single source for the homepage "Selected Work" and the /work page.
   To add a project: append an object. `featured: true` puts it on the homepage (first three are shown).
   yt = YouTube video ID (the part after youtu.be/). */
export const PROJECTS = [
  {slug:'after-hours', title:'After Hours', d:'Narrative spot · Slider, practicals', src:asset('media/work-03.jpg'), yt:'A92_B_mnO-I', featured:true,
   alt:'Camera operator on a slider dollying past a living-room set lit by practical lights and a glowing TV'},
  {slug:'stage-b', title:'Stage B', d:'Robotic camera · Virtual set', src:asset('media/work-01.jpg'), yt:'LX_4HSqMX5g', featured:true,
   alt:'Studio stage with a robotic motion-control camera arm, large softbox and a performer against a blue cyclorama'},
  {slug:'rink-night', title:'Rink Night', d:'Cinema rig · Handheld', src:asset('media/work-02.jpg'), yt:'uZcirsK_HnE', featured:true,
   alt:'Operator holding a fully rigged cinema camera in a roller rink washed in violet light'}
];
ASSETS.work = PROJECTS.filter(p=>p.featured).slice(0,3);

export const STATEMENTS = [
  {cls:'s1', lines:["We don't","just film."]},
  {cls:'s2', lines:['We make','you feel.']},
  {cls:'s3', lines:['Every frame','matters.']}
];
// scroll windows inside the hero's progress (0..1). Gaps between them keep each line its own moment.
export const WINDOWS = [[0.03,0.31],[0.36,0.64],[0.69,1.0]];

export const VISION = "We believe great films do more than capture attention. They create emotion, shape perception, and turn ordinary moments into unforgettable stories. Every frame is an opportunity to make something meaningful.";

// Section 1 — image hero (studio lighting rig). WebP for modern browsers, JPG fallback.
// On portrait screens the image is cropped by height, so it renders ~178vh wide.
export const INTRO = {
  webp: 'media/studio-960.webp 960w, media/studio-1600.webp 1600w, media/studio-2560.webp 2560w',
  jpgSet: 'media/studio-1600.jpg 1600w, media/studio-2560.jpg 2560w',
  jpg: 'media/studio-1600.jpg',
  sizes: '(max-aspect-ratio: 16/9) 178vh, 100vw',
  alt: 'Empty film studio at night: a forest of light stands, softboxes and booms in silhouette against a glowing white cyclorama'
};
