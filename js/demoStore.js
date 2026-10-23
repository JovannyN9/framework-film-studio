/* DEMO BACKEND — for showing the collaborator flow without Supabase.
   ⚠ Not secure and not shared: projects live in THIS browser's localStorage only, and the password check
   runs in the browser. Only active while js/config.js has no Supabase keys AND DEMO_MODE is true.
   The password is stored as a SHA-256 hash, so it isn't readable in the code — but a hash in the browser is
   still not real authentication. Use Supabase (SETUP-SUPABASE.md) before giving access to real collaborators. */

const PROJECTS_KEY = 'fw-demo-projects';
const SESSION_KEY = 'fw-demo-session';
const PASS_SHA256 = '6fa0856612955098ba6643d8b9f2124cef20e940abc65e0142764b50e2fd7e5a';

const read = ()=>{ try{ return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; }catch(_){ return []; } };
const write = rows=>{
  try{ localStorage.setItem(PROJECTS_KEY, JSON.stringify(rows)); }
  catch(_){ throw new Error('The browser’s demo storage is full. Delete a project or use a smaller thumbnail.'); }
};
const now = ()=>new Date().toISOString();

async function sha256(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.normalize('NFC')));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* ---------- auth ---------- */
export async function signIn(email, password){
  if(!crypto.subtle) throw new Error('Open the site from localhost or https to use the demo login.');
  if(!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Enter a valid email.');
  if(await sha256(password) !== PASS_SHA256) throw new Error('Email or password is incorrect.');
  const user = { email: email.trim(), id: 'demo' };
  try{ localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }catch(_){}
  return user;
}
export async function signOut(){ try{ localStorage.removeItem(SESSION_KEY); }catch(_){} }
export async function currentUser(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)); }catch(_){ return null; } }

/* ---------- projects ---------- */
export async function listMine(){ return read().sort((a,b)=>b.updated_at.localeCompare(a.updated_at)); }
export async function listPublished(){
  return read().filter(r=>r.status === 'published').sort((a,b)=>(a.published_at||'').localeCompare(b.published_at||''));
}
export async function saveProject(id, fields, file, removeThumb){
  const rows = read();
  const prev = rows.find(r=>r.id === id);
  let thumbnail_url = prev ? prev.thumbnail_url : null;
  if(file) thumbnail_url = await shrink(file);
  else if(removeThumb) thumbnail_url = null;
  const row = {
    ...(prev || { id: crypto.randomUUID(), created_at: now() }),
    ...fields, thumbnail_url, updated_at: now(),
    published_at: fields.status === 'published' ? (prev && prev.status === 'published' && prev.published_at) || now() : null
  };
  write(prev ? rows.map(r=>r.id === id ? row : r) : [row, ...rows]);
  return row;
}
export async function deleteProject(p){ write(read().filter(r=>r.id !== p.id)); }

/* Thumbnails are kept as JPEG data URLs, scaled to max 1600px wide so localStorage (≈5 MB) isn't exhausted */
function shrink(file){
  return new Promise((res, rej)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      const scale = Math.min(1, 1600 / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); rej(new Error('That image could not be read. Try another JPG, PNG or WebP.')); };
    img.src = url;
  });
}
