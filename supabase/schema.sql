-- FRAMEWORK — collaborator projects
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: it drops and recreates its own policies.

-- ─────────────────────────────────────────────────────────────
-- 1. Who is a collaborator (an allow-list, managed by you in the dashboard)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.collaborators (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text,
  created_at timestamptz not null default now()
);
alter table public.collaborators enable row level security;
drop policy if exists "collaborator sees own row" on public.collaborators;
create policy "collaborator sees own row" on public.collaborators
  for select to authenticated using (user_id = auth.uid());
-- No insert/update/delete policies: only you (SQL editor / Table editor) can add or remove collaborators.

create or replace function public.is_collaborator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.collaborators where user_id = auth.uid());
$$;
revoke all on function public.is_collaborator() from public;
grant execute on function public.is_collaborator() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Projects
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(btrim(title)) between 1 and 120),
  youtube_id    text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  description   text not null default '' check (char_length(description) <= 400),
  category      text not null check (category in
                  ('Commercial','Fashion','Documentary','Music Video','Branded Content','Narrative','Other')),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://'),
  status        text not null default 'draft' check (status in ('draft','published')),
  created_by    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index if not exists projects_published_idx on public.projects (status, published_at);

-- keep updated_at / published_at honest, and never let a client reassign ownership
create or replace function public.projects_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.created_by := old.created_by; end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end $$;
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before insert or update on public.projects
  for each row execute function public.projects_touch();

alter table public.projects enable row level security;

drop policy if exists "anyone reads published"        on public.projects;
drop policy if exists "collaborator reads own"        on public.projects;
drop policy if exists "collaborator inserts own"      on public.projects;
drop policy if exists "collaborator updates own"      on public.projects;
drop policy if exists "collaborator deletes own"      on public.projects;

create policy "anyone reads published" on public.projects
  for select to anon, authenticated using (status = 'published');
create policy "collaborator reads own" on public.projects
  for select to authenticated using (public.is_collaborator() and created_by = auth.uid());
create policy "collaborator inserts own" on public.projects
  for insert to authenticated with check (public.is_collaborator() and created_by = auth.uid());
create policy "collaborator updates own" on public.projects
  for update to authenticated
  using (public.is_collaborator() and created_by = auth.uid())
  with check (public.is_collaborator() and created_by = auth.uid());
create policy "collaborator deletes own" on public.projects
  for delete to authenticated using (public.is_collaborator() and created_by = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. Thumbnail storage (public read, collaborators write only inside their own folder)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "thumbs: collaborator upload" on storage.objects;
drop policy if exists "thumbs: collaborator update" on storage.objects;
drop policy if exists "thumbs: collaborator delete" on storage.objects;

create policy "thumbs: collaborator upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'thumbnails' and public.is_collaborator()
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "thumbs: collaborator update" on storage.objects
  for update to authenticated
  using (bucket_id = 'thumbnails' and public.is_collaborator()
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy "thumbs: collaborator delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'thumbnails' and public.is_collaborator()
         and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- 4. After creating the collaborator's user (Authentication → Users → Add user),
--    add them to the allow-list. Replace the email:
-- ─────────────────────────────────────────────────────────────
-- insert into public.collaborators (user_id, name)
-- select id, 'Collaborator' from auth.users where email = 'collaborator@yourdomain.com';
