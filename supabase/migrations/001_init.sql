-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('admin','user')),
  disabled boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Profiles policies
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);

create policy profiles_select_admin on public.profiles
  for select using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id);

create policy profiles_update_admin on public.profiles
  for update using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy profiles_delete_admin on public.profiles
  for delete using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Processed files
create table if not exists public.processed_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  original_name text not null,
  file_url text,
  file_type text not null check (file_type in ('split','merge')),
  page_count int not null,
  operation_data jsonb,
  created_at timestamptz default now()
);
alter table public.processed_files enable row level security;

-- Processed files policies
create policy processed_insert_self on public.processed_files
  for insert with check (auth.uid() = user_id);

create policy processed_select_self on public.processed_files
  for select using (auth.uid() = user_id);

create policy processed_select_admin on public.processed_files
  for select using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy processed_delete_self on public.processed_files
  for delete using (auth.uid() = user_id);

create policy processed_delete_admin on public.processed_files
  for delete using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Storage bucket for PDFs
insert into storage.buckets (id, name, public)
values ('pdf-files', 'pdf-files', true)
on conflict (id) do nothing;

-- Storage policies
create policy storage_pdf_public_read on storage.objects
  for select using (bucket_id = 'pdf-files');

create policy storage_pdf_auth_insert on storage.objects
  for insert with check (bucket_id = 'pdf-files' and auth.role() = 'authenticated');

create policy storage_pdf_auth_update on storage.objects
  for update using (bucket_id = 'pdf-files' and auth.role() = 'authenticated');

create policy storage_pdf_auth_delete on storage.objects
  for delete using (bucket_id = 'pdf-files' and auth.role() = 'authenticated');

