import { html, useCallback, useEffect, useRef, useState } from '../lib.js';
import { HREF, go } from '../site.js';
import { COLLAB_ENABLED, DEMO_ACTIVE, loadBackend } from '../config.js';
import { CATEGORIES, LIMITS, THUMB_TYPES, parseYouTube, rowToCard, validateProject, ytThumb } from '../projects.js';
import { Card } from './WorkIndex.js';

/* /collaborators — login + project dashboard.
   Real mode: Supabase Auth + RLS (supabase/schema.sql).
   Demo mode (no Supabase keys): same screens, data saved in this browser only (js/demoStore.js), labelled on screen. */

const backend = loadBackend;
const api = {
  list: ()=>backend().then(b=>b.listMine()),
  save: (id, f, file, rm)=>backend().then(b=>b.saveProject(id, f, file, rm)),
  remove: p=>backend().then(b=>b.deleteProject(p))
};

/* ───────────────── App ───────────────── */
export function CollabApp(){
  const [state,setState] = useState(COLLAB_ENABLED ? 'checking' : 'login');   // checking | login | dash
  const [user,setUser] = useState(null);
  const demo = DEMO_ACTIVE;

  useEffect(()=>{
    if(!COLLAB_ENABLED) return;
    backend().then(b=>b.currentUser())
      .then(u=>{ if(u){ setUser(u); setState('dash'); } else setState('login'); })
      .catch(()=>setState('login'));
  },[]);

  const logout = async ()=>{
    try{ await (await backend()).signOut(); }catch(_){}
    setUser(null); setState('login');
  };

  return html`
    <div class="cb">
      <header class="cb-bar wrap">
        <a class="wordmark" href=${HREF.home} onClick=${e=>go(HREF.home, e)}>Framework</a>
        <span class="eyebrow cb-bar-title">Collaborators</span>
        ${state === 'dash' && html`
          <div class="cb-bar-user">
            <span class="cb-user">${user.email}${demo ? ' · demo' : ''}</span>
            <button class="cb-btn ghost" type="button" onClick=${logout}>Log out</button>
          </div>`}
      </header>
      ${state === 'checking' && html`<p class="cb-status wrap" role="status">Checking your session…</p>`}
      ${state === 'login' && html`<${Login} onIn=${u=>{ setUser(u); setState('dash'); }} />`}
      ${state === 'dash' && html`<${Dashboard} demo=${demo} />`}
    </div>`;
}

/* ───────────────── Login ───────────────── */
function Login({ onIn }){
  const [email,setEmail] = useState('');
  const [pw,setPw] = useState('');
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState('');
  const submit = async e=>{
    e.preventDefault();
    if(!COLLAB_ENABLED) return;
    setErr('');
    if(!email.trim() || !pw){ setErr('Enter your email and password.'); return; }
    setBusy(true);
    try{ onIn(await (await backend()).signIn(email, pw)); }
    catch(x){ setErr(x.message); setPw(''); }
    finally{ setBusy(false); }
  };
  return html`
    <main class="cb-login wrap">
      <div class="cb-login-inner">
        <p class="eyebrow cb-muted">Private area</p>
        <h1 class="display cb-h1">Collaborator<br/>login</h1>
        ${!COLLAB_ENABLED && html`
          <div class="cb-notice" role="note">
            <strong>Login is switched off.</strong> Connect Supabase (<code>SETUP-SUPABASE.md</code>) or turn on <code>DEMO_MODE</code> in <code>js/config.js</code>.
          </div>`}
        ${DEMO_ACTIVE && html`
          <div class="cb-notice" role="note">
            <strong>Demo mode.</strong> Projects you add are saved in this browser only, so other visitors won’t see them.
            Connect Supabase to make it real (<code>SETUP-SUPABASE.md</code>).
          </div>`}
        <form class="cb-form" onSubmit=${submit} noValidate>
          <label class="cb-field"><span class="cb-label">Email</span>
            <input id="cb-email" type="email" autocomplete="username" value=${email} onInput=${e=>setEmail(e.target.value)} disabled=${!COLLAB_ENABLED || busy} required />
          </label>
          <label class="cb-field"><span class="cb-label">Password</span>
            <input id="cb-pw" type="password" autocomplete="current-password" value=${pw} onInput=${e=>setPw(e.target.value)} disabled=${!COLLAB_ENABLED || busy} required />
          </label>
          ${err && html`<p class="cb-error" role="alert">${err}</p>`}
          <button class="cb-btn primary" type="submit" disabled=${!COLLAB_ENABLED || busy}>${busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </main>`;
}

/* ───────────────── Dashboard ───────────────── */
function Dashboard({ demo }){
  const [rows,setRows] = useState(null);
  const [loadErr,setLoadErr] = useState('');
  const [editing,setEditing] = useState(null);     // null | 'new' | row
  const [confirmId,setConfirmId] = useState(null);
  const [toast,setToast] = useState('');
  const [busyId,setBusyId] = useState(null);

  const load = useCallback(()=>{
    setLoadErr('');
    api.list().then(setRows).catch(e=>{ setLoadErr(e.message); setRows([]); });
  },[]);
  useEffect(load,[]);
  const flash = msg=>{ setToast(msg); clearTimeout(flash.t); flash.t = setTimeout(()=>setToast(''), 3200); };

  const remove = async r=>{
    setBusyId(r.id);
    try{ await api.remove(r); setConfirmId(null); flash(`Deleted “${r.title}”.`); load(); }
    catch(e){ flash(e.message); }
    finally{ setBusyId(null); }
  };

  const pub = rows ? rows.filter(r=>r.status === 'published').length : 0;
  const drafts = rows ? rows.length - pub : 0;

  if(editing) return html`
    <${Editor} api=${api} demo=${demo} initial=${editing === 'new' ? null : editing}
      onCancel=${()=>setEditing(null)}
      onSaved=${(row, msg)=>{ setEditing(null); flash(msg); load(); }} />`;

  return html`
    <main class="cb-dash wrap">
      ${demo && html`<p class="cb-demo-banner" role="note">Demo mode: projects are saved in this browser only. Published ones appear on /work here, not for other visitors.</p>`}
      <div class="cb-head">
        <div>
          <p class="eyebrow cb-muted">Your projects</p>
          <h1 class="display cb-h1">Projects</h1>
          <p class="cb-counts"><span>${pub} published</span><span>${drafts} ${drafts === 1 ? 'draft' : 'drafts'}</span></p>
        </div>
        <button class="cb-btn primary" type="button" onClick=${()=>setEditing('new')}>+ Add new project</button>
      </div>

      ${rows === null && html`<p class="cb-status" role="status">Loading projects…</p>`}
      ${loadErr && html`<p class="cb-error" role="alert">${loadErr} <button class="cb-link" type="button" onClick=${load}>Try again</button></p>`}
      ${rows && rows.length === 0 && !loadErr && html`
        <div class="cb-empty">
          <p>No projects yet.</p>
          <p class="cb-muted">Add a title and a YouTube link. Save it as a draft, or publish it straight to the Work page.</p>
        </div>`}
      ${rows && rows.length > 0 && html`
        <ul class="cb-list">
          ${rows.map(r=>html`
            <li class="cb-row" key=${r.id}>
              <span class="cb-thumb"><img src=${r.thumbnail_url || ytThumb(r.youtube_id,'mqdefault')} alt="" loading="lazy" /></span>
              <span class="cb-row-main">
                <span class="cb-row-title">${r.title}</span>
                <span class="cb-row-meta">${r.category} · updated ${new Date(r.updated_at).toLocaleDateString()}</span>
              </span>
              <span class=${'cb-pill ' + r.status}>${r.status === 'published' ? 'Published' : 'Draft'}</span>
              ${confirmId === r.id
                ? html`<span class="cb-confirm" role="group" aria-label="Confirm delete">
                    <span>Delete “${r.title}”? This can’t be undone.</span>
                    <button class="cb-btn danger" type="button" disabled=${busyId === r.id} onClick=${()=>remove(r)}>${busyId === r.id ? 'Deleting…' : 'Delete'}</button>
                    <button class="cb-btn ghost" type="button" onClick=${()=>setConfirmId(null)}>Cancel</button>
                  </span>`
                : html`<span class="cb-actions">
                    <button class="cb-btn ghost" type="button" onClick=${()=>setEditing(r)}>Edit</button>
                    <button class="cb-btn ghost" type="button" onClick=${()=>setConfirmId(r.id)}>Delete</button>
                  </span>`}
            </li>`)}
        </ul>`}
      ${toast && html`<p class="cb-toast" role="status">${toast}</p>`}
    </main>`;
}

/* ───────────────── Editor ───────────────── */
function Editor({ api, demo, initial, onCancel, onSaved }){
  const [f,setF] = useState(()=>({
    title: initial ? initial.title : '',
    youtube: initial ? 'https://youtu.be/' + initial.youtube_id : '',
    description: initial ? initial.description || '' : '',
    category: initial ? initial.category : '',
    status: initial ? initial.status : 'draft',
    file: null, removeThumb: false
  }));
  const [errors,setErrors] = useState({});
  const [busy,setBusy] = useState(false);
  const [serverErr,setServerErr] = useState('');
  const [fileURL,setFileURL] = useState(null);
  const fileRef = useRef(null);
  const set = (k,v)=>setF(s=>({ ...s, [k]:v }));

  useEffect(()=>{ if(!f.file){ setFileURL(null); return; } const u = URL.createObjectURL(f.file); setFileURL(u); return ()=>URL.revokeObjectURL(u); },[f.file]);

  const ytId = parseYouTube(f.youtube);
  const existingThumb = initial && initial.thumbnail_url && !f.removeThumb ? initial.thumbnail_url : null;
  const previewCard = {
    slug:'preview', title: f.title.trim() || 'Project title', d: f.category || 'Category', alt:'Thumbnail preview',
    yt: ytId, description: f.description.trim(),
    src: fileURL || existingThumb || (ytId ? ytThumb(ytId) : null),
    ytFallback: fileURL || existingThumb ? null : (ytId ? ytThumb(ytId,'hqdefault') : null)
  };

  const pickFile = e=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const v = validateProject({ ...f, file });
    setErrors(er=>({ ...er, file: v.errors.file }));
    if(!v.errors.file) setF(s=>({ ...s, file, removeThumb:false }));
    e.target.value = '';
  };

  const save = async e=>{
    e.preventDefault();
    setServerErr('');
    const v = validateProject(f);
    setErrors(v.errors);
    if(!v.ok){ const first = document.querySelector('.cb-editor [aria-invalid="true"]'); if(first) first.focus(); return; }
    setBusy(true);
    try{
      const row = await api.save(initial && initial.id, { ...v.clean, status: f.status }, f.file, f.removeThumb);
      const msg = f.status === 'published'
        ? (demo ? `Published “${row.title}”. Open /work in this browser to see it.` : `Published “${row.title}”. It’s now live on the Work page.`)
        : `Saved “${row.title}” as a draft.`;
      onSaved(row, msg);
    }catch(x){ setServerErr(x.message); }
    finally{ setBusy(false); }
  };

  const field = (k)=>({ 'aria-invalid': errors[k] ? 'true' : 'false', 'aria-describedby': errors[k] ? `err-${k}` : null });
  const Err = ({k})=>errors[k] ? html`<span class="cb-error" id=${'err-'+k}>${errors[k]}</span>` : null;

  return html`
    <main class="cb-editor wrap">
      <button class="cb-link back" type="button" onClick=${onCancel}>← All projects</button>
      <h1 class="display cb-h1">${initial ? 'Edit project' : 'New project'}</h1>
      <div class="cb-editor-grid">
        <form class="cb-form" onSubmit=${save} noValidate>
          <label class="cb-field"><span class="cb-label">Project title</span>
            <input id="pf-title" type="text" maxLength=${LIMITS.title} value=${f.title} onInput=${e=>set('title', e.target.value)} ...${field('title')} />
            <${Err} k="title" />
          </label>

          <label class="cb-field"><span class="cb-label">YouTube video URL</span>
            <input id="pf-yt" type="url" inputMode="url" placeholder="https://youtu.be/…" value=${f.youtube}
              onInput=${e=>set('youtube', e.target.value)} onBlur=${()=>f.youtube && setErrors(er=>({ ...er, youtube: validateProject(f).errors.youtube }))} ...${field('youtube')} />
            ${ytId && !errors.youtube && html`<span class="cb-hint ok">Video found · ID ${ytId}</span>`}
            <${Err} k="youtube" />
          </label>

          <label class="cb-field"><span class="cb-label">Short description <span class="cb-count">${f.description.length}/${LIMITS.description}</span></span>
            <textarea id="pf-desc" rows="4" maxLength=${LIMITS.description} value=${f.description} onInput=${e=>set('description', e.target.value)} ...${field('description')}></textarea>
            <${Err} k="description" />
          </label>

          <label class="cb-field"><span class="cb-label">Category</span>
            <select id="pf-cat" value=${f.category} onChange=${e=>set('category', e.target.value)} ...${field('category')}>
              <option value="" disabled>Choose a category</option>
              ${CATEGORIES.map(c=>html`<option key=${c} value=${c}>${c}</option>`)}
            </select>
            <${Err} k="category" />
          </label>

          <div class="cb-field">
            <span class="cb-label">Thumbnail <span class="cb-muted">(optional)</span></span>
            <div class="cb-file">
              <button class="cb-btn ghost" type="button" onClick=${()=>fileRef.current.click()}>${f.file || existingThumb ? 'Replace image' : 'Upload image'}</button>
              <input id="pf-file" ref=${fileRef} type="file" accept=${THUMB_TYPES.join(',')} onChange=${pickFile} hidden />
              ${(f.file || existingThumb) && html`<button class="cb-link" type="button" onClick=${()=>setF(s=>({ ...s, file:null, removeThumb:true }))}>Use YouTube thumbnail instead</button>`}
            </div>
            <span class="cb-hint">${f.file ? f.file.name : existingThumb ? 'Custom image' : 'No image uploaded: the YouTube thumbnail is used.'} JPG, PNG or WebP, max 5 MB.</span>
            <${Err} k="file" />
          </div>

          <fieldset class="cb-field cb-status-pick">
            <legend class="cb-label">Status</legend>
            <div class="cb-seg">
              <label><input type="radio" name="pf-status" value="draft" checked=${f.status === 'draft'} onChange=${()=>set('status','draft')} /><span>Draft</span></label>
              <label><input type="radio" name="pf-status" value="published" checked=${f.status === 'published'} onChange=${()=>set('status','published')} /><span>Published</span></label>
            </div>
            <span class="cb-hint">${f.status === 'published' ? 'Visible to everyone on the Work page.' : 'Only you can see drafts.'}</span>
          </fieldset>

          ${serverErr && html`<p class="cb-error" role="alert">${serverErr}</p>`}
          <div class="cb-form-actions">
            <button class="cb-btn primary" type="submit" disabled=${busy}>
              ${busy ? 'Saving…' : f.status === 'published' ? (initial && initial.status === 'published' ? 'Save changes' : 'Publish') : 'Save draft'}
            </button>
            <button class="cb-btn ghost" type="button" onClick=${onCancel} disabled=${busy}>Cancel</button>
          </div>
        </form>

        <aside class="cb-preview" aria-label="Live preview">
          <p class="eyebrow cb-muted">Preview · as it will appear on /work</p>
          <div class="wk is-in cb-preview-stage">
            <ul class="wk-grid cb-preview-grid">
              ${previewCard.yt || previewCard.src
                ? html`<${Card} p=${previewCard} i=${3} wide=${false} />`
                : html`<li class="cb-preview-empty">Paste a YouTube link to see the card.</li>`}
            </ul>
            ${previewCard.description && html`<p class="cb-preview-desc">${previewCard.description}</p>`}
          </div>
        </aside>
      </div>
    </main>`;
}
