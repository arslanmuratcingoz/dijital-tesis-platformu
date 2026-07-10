-- Dijital Tesis Platformu v1 Supabase kurulumu
-- Supabase SQL Editor içinde tek sefer çalıştır.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text,
  full_name text,
  role text not null default 'editor' check (role in ('admin','editor','viewer')),
  title text,
  department text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  template text not null default 'blank',
  project_state jsonb not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  change_type text not null,
  prompt text,
  ai_plan jsonb,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.project_backups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  label text,
  backup_state jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_changes enable row level security;
alter table public.project_backups enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select
to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update
to authenticated using (id = auth.uid() or public.is_admin(auth.uid())) with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "projects_select_own_or_admin" on public.projects;
create policy "projects_select_own_or_admin" on public.projects for select
to authenticated using (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects for insert
to authenticated with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "projects_update_own_or_admin" on public.projects;
create policy "projects_update_own_or_admin" on public.projects for update
to authenticated using (owner_id = auth.uid() or public.is_admin(auth.uid())) with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "changes_select_related_or_admin" on public.project_changes;
create policy "changes_select_related_or_admin" on public.project_changes for select
to authenticated using (
  public.is_admin(auth.uid()) or exists(select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

drop policy if exists "changes_insert_related" on public.project_changes;
create policy "changes_insert_related" on public.project_changes for insert
to authenticated with check (
  user_id = auth.uid() and exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin(auth.uid())))
);

drop policy if exists "backups_select_related_or_admin" on public.project_backups;
create policy "backups_select_related_or_admin" on public.project_backups for select
to authenticated using (
  public.is_admin(auth.uid()) or exists(select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

drop policy if exists "backups_insert_related" on public.project_backups;
create policy "backups_insert_related" on public.project_backups for insert
to authenticated with check (
  created_by = auth.uid() and exists(select 1 from public.projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_admin(auth.uid())))
);
