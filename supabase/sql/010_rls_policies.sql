-- supabase/sql/010_rls_policies.sql
-- Ensure RLS is enabled
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;

-- Basic owner policy for profiles
create policy "profiles_owner_select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- progress: users can see and write only their rows
create policy "progress_owner_select"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "progress_owner_insert"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "progress_owner_update"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "progress_owner_delete"
  on public.progress for delete
  using (auth.uid() = user_id);

-- Admin role sample (if you use 'is_admin' boolean on profiles)
-- Allows admins to manage courses/modules
create policy "courses_admin_all"
  on public.courses for all
  using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin = true))
  with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin = true));

create policy "modules_admin_all"
  on public.modules for all
  using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin = true))
  with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin = true));
