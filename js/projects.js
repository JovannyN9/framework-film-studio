/* Project rules shared by the dashboard and /work: YouTube parsing, thumbnails, validation, mapping.
   The database enforces the same limits (supabase/schema.sql) — this file just gives fast, friendly feedback. */

export const CATEGORIES = ['Commercial','Fashion','Documentary','Music Video','Branded Content','Narrative','Other'];
export const LIMITS = { title:120, description:400, thumbBytes:5*1024*1024 };
export const THUMB_TYPES = ['image/jpeg','image/png','image/webp'];

const ID = /^[A-Za-z0-9_-]{11}$/;
/* Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID, m.youtube.com, music.youtube.com, or a bare ID. */
export function parseYouTube(input){
  const raw = (input || '').trim();
  if(ID.test(raw)) return raw;
  let u;
  try{ u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); }catch(_){ return null; }
  const host = u.hostname.replace(/^(www|m|music)\./,'');
  let id = null;
  if(host === 'youtu.be') id = u.pathname.split('/')[1];
  else if(host === 'youtube.com' || host === 'youtube-nocookie.com'){
    if(u.pathname === '/watch') id = u.searchParams.get('v');
    else { const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/); if(m) id = m[2]; }
  }
  return id && ID.test(id) ? id : null;
}

export const ytThumb = (id, q='maxresdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;

/* returns { ok, errors:{field:msg}, clean } */
export function validateProject(f){
  const errors = {};
  const title = (f.title || '').trim().replace(/\s+/g,' ');
  const description = (f.description || '').trim();
  const yt = parseYouTube(f.youtube);
  if(!title) errors.title = 'Add a title.';
  else if(title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if(!f.youtube || !f.youtube.trim()) errors.youtube = 'Paste the YouTube link.';
  else if(!yt) errors.youtube = 'That doesn’t look like a YouTube video link. Try the “Share” link, e.g. https://youtu.be/A92_B_mnO-I';
  if(description.length > LIMITS.description) errors.description = `Keep the description under ${LIMITS.description} characters.`;
  if(!CATEGORIES.includes(f.category)) errors.category = 'Choose a category.';
  if(f.file){
    if(!THUMB_TYPES.includes(f.file.type)) errors.file = 'Use a JPG, PNG or WebP image.';
    else if(f.file.size > LIMITS.thumbBytes) errors.file = 'The image must be 5 MB or smaller.';
  }
  return { ok: Object.keys(errors).length === 0, errors, clean:{ title, description, youtube_id: yt, category: f.category } };
}

const safeHttps = u => typeof u === 'string' && (/^https:\/\//.test(u) || /^data:image\/(jpeg|png|webp);base64,/.test(u)) ? u : null;

/* database row → the card shape /work already uses for the original projects */
export function rowToCard(r){
  return {
    slug: 'p-' + r.id,
    title: r.title,
    d: r.category,
    description: r.description || '',
    yt: r.youtube_id,
    src: safeHttps(r.thumbnail_url) || ytThumb(r.youtube_id),
    ytFallback: safeHttps(r.thumbnail_url) ? null : ytThumb(r.youtube_id, 'hqdefault'),
    alt: `Still from “${r.title}”`
  };
}
