/* Supabase connection — fill these two values to switch the collaborator system on.
   Supabase → Project Settings → API:
     SUPABASE_URL       "Project URL"            e.g. https://abcdefghijkl.supabase.co
     SUPABASE_ANON_KEY  "anon / public" key      (long string starting with eyJ…)

   The anon key is MEANT to be public: it only allows what the Row Level Security policies in
   supabase/schema.sql allow (anyone: read published projects; signed-in collaborators: manage their own).
   NEVER paste the "service_role" key or any password here — everything in /js is downloaded by visitors. */
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

/* DEMO_MODE: while Supabase is not configured, the collaborator login and uploads still work for
   demonstrations, saving to the current browser only (js/demoStore.js). Set to false to switch it off. */
export const DEMO_MODE = true;

export const BACKEND_READY = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 40;
export const DEMO_ACTIVE = !BACKEND_READY && DEMO_MODE;
export const COLLAB_ENABLED = BACKEND_READY || DEMO_ACTIVE;
/* the module that implements signIn/listMine/saveProject/… for the current mode */
export const loadBackend = ()=> BACKEND_READY ? import('./backend.js') : import('./demoStore.js');
