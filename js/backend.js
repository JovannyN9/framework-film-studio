/* All Supabase access lives here. The client library is loaded only when it is needed
   (the /collaborators page, or /work when the backend is configured) — the homepage never loads it. */
import { SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_READY } from './config.js';
export { BACKEND_READY };

const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const TABLE = 'projects', BUCKET = 'thumbnails';
let clientP = null;

function loadScript(src){
  return new Promise((res, rej)=>{
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = ()=>rej(new Error('Could not load the Supabase library. Check the internet connection.'));
    document.head.appendChild(s);
  });
}
export function client(){
  if(!BACKEND_READY) return Promise.reject(new Error('Supabase is not configured yet (js/config.js).'));
  if(!clientP){
    clientP = (window.supabase ? Promise.resolve() : loadScript(LIB))
      .then(()=>window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth:{ persistSession:true, autoRefreshToken:true, storageKey:'fw-collab-auth' }
      }));
  }
  return clientP;
}
const check = ({ data, error })=>{ if(error) throw new Error(friendly(error)); return data; };
function friendly(err){
  const m = (err && err.message) || String(err);
  if(/Invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
  if(/row-level security|permission denied|violates row-level/i.test(m)) return 'Your account is not authorised to do that. Ask the studio to add you as a collaborator.';
  if(/Failed to fetch|NetworkError/i.test(m)) return 'Can’t reach the server. Check your connection and try again.';
  if(/check constraint/i.test(m)) return 'Some fields were rejected by the server. Check the title, link and category.';
  return m;
}

/* ---------- public ---------- */
export async function listPublished(){
  const sb = await client();
  return check(await sb.from(TABLE)
    .select('id,title,description,category,youtube_id,thumbnail_url,published_at')
    .eq('status','published').order('published_at', { ascending:true }));
}

/* ---------- auth ---------- */
export async function signIn(email, password){
  const sb = await client();
  const data = check(await sb.auth.signInWithPassword({ email: email.trim(), password }));
  // a valid Supabase user is not enough: must be on the collaborators list
  const ok = await isCollaborator();
  if(!ok){ await sb.auth.signOut(); throw new Error('This account is not on the collaborator list.'); }
  return data.user;
}
export async function signOut(){ const sb = await client(); await sb.auth.signOut(); }
export async function currentUser(){
  const sb = await client();
  const { data } = await sb.auth.getSession();
  if(!data.session) return null;
  return (await isCollaborator()) ? data.session.user : null;
}
async function isCollaborator(){
  const sb = await client();
  const { data, error } = await sb.rpc('is_collaborator');
  return !error && data === true;
}

/* ---------- collaborator CRUD (RLS limits these to the signed-in collaborator's own rows) ---------- */
export async function listMine(){
  const sb = await client();
  const { data:{ user } } = await sb.auth.getUser();
  return check(await sb.from(TABLE).select('*').eq('created_by', user.id).order('updated_at', { ascending:false }));
}
export async function saveProject(id, fields, file, removeThumb){
  const sb = await client();
  const { data:{ user } } = await sb.auth.getUser();
  const row = { ...fields };
  if(file) row.thumbnail_url = await uploadThumb(sb, user.id, file);
  else if(removeThumb) row.thumbnail_url = null;
  if(id) return check(await sb.from(TABLE).update(row).eq('id', id).select().single());
  return check(await sb.from(TABLE).insert(row).select().single());
}
export async function deleteProject(p){
  const sb = await client();
  check(await sb.from(TABLE).delete().eq('id', p.id));
  const path = storagePath(p.thumbnail_url);
  if(path) await sb.storage.from(BUCKET).remove([path]);   // best effort
}
async function uploadThumb(sb, uid, file){
  const ext = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' }[file.type] || 'jpg';
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;   // policies only allow writing inside your own folder
  check(await sb.storage.from(BUCKET).upload(path, file, { contentType:file.type, cacheControl:'31536000', upsert:false }));
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
function storagePath(url){
  if(!url) return null;
  const m = url.match(new RegExp(`/storage/v1/object/public/${BUCKET}/(.+)$`));
  return m ? decodeURIComponent(m[1]) : null;
}
