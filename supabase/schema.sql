-- Run this whole file once: Supabase > SQL Editor > New query > Run

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('student','rep','admin','owner')),
  created_at timestamptz default now()
);
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  level int not null,
  semester int not null check (semester in (1,2)),
  created_at timestamptz default now()
);
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  kind text not null default 'Other',
  session text,
  drive_file_id text not null,
  size_bytes bigint,
  downloads int not null default 0,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  reason text not null,
  details text,
  reporter uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  course_text text not null,
  details text not null,
  requester uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null,
  title text not null,
  text text,
  link text not null,
  placement text not null check (placement in ('body','bottom')),
  media_url text not null,
  media_path text,
  media_type text not null check (media_type in ('image','video')),
  starts_on date,
  ends_on date,
  active boolean not null default true,
  views int not null default 0,
  taps int not null default 0,
  created_at timestamptz default now()
);
create table if not exists settings (
  key text primary key,
  value text
);

create index if not exists documents_course_idx on documents(course_id);
create index if not exists courses_level_idx on courses(level);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.increment_downloads(doc uuid) returns void
language sql security definer set search_path = public as $$
  update public.documents set downloads = downloads + 1 where id = doc
$$;
revoke execute on function public.increment_downloads(uuid) from public, anon, authenticated;

create or replace function public.track_ad(ad uuid, kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if kind = 'view' then update public.ads set views = views + 1 where id = ad;
  elsif kind = 'tap' then update public.ads set taps = taps + 1 where id = ad;
  end if;
end $$;

alter table profiles  enable row level security;
alter table courses   enable row level security;
alter table documents enable row level security;
alter table reports   enable row level security;
alter table requests  enable row level security;
alter table ads       enable row level security;
alter table settings  enable row level security;

-- profiles: owner manages everyone, admin manages students and reps only
create policy "read own profile or staff" on profiles for select
  using (id = auth.uid() or public.my_role() in ('admin','owner'));
create policy "owner and admin update roles" on profiles for update
  using (public.my_role() = 'owner' or (public.my_role() = 'admin' and role in ('student','rep')))
  with check (public.my_role() = 'owner' or role in ('student','rep'));

-- courses
create policy "anyone reads courses" on courses for select using (true);
create policy "staff add courses" on courses for insert with check (public.my_role() in ('admin','owner'));
create policy "staff edit courses" on courses for update using (public.my_role() in ('admin','owner'));
create policy "staff delete courses" on courses for delete using (public.my_role() in ('admin','owner'));

-- documents
create policy "anyone reads documents" on documents for select using (true);
create policy "reps add documents" on documents for insert
  with check (public.my_role() in ('rep','admin','owner') and uploaded_by = auth.uid());

-- reports and requests: any signed-in user sends, staff read and clear
create policy "send reports" on reports for insert to authenticated with check (reporter = auth.uid());
create policy "staff read reports" on reports for select using (public.my_role() in ('admin','owner'));
create policy "staff clear reports" on reports for delete using (public.my_role() in ('admin','owner'));
create policy "send requests" on requests for insert to authenticated with check (requester = auth.uid());
create policy "staff read requests" on requests for select using (public.my_role() in ('admin','owner'));
create policy "staff clear requests" on requests for delete using (public.my_role() in ('admin','owner'));

-- ads: public sees live ones, only the owner manages them
create policy "public reads live ads" on ads for select
  using (active and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date));
create policy "owner reads all ads" on ads for select using (public.my_role() = 'owner');
create policy "owner adds ads" on ads for insert with check (public.my_role() = 'owner');
create policy "owner edits ads" on ads for update using (public.my_role() = 'owner');
create policy "owner deletes ads" on ads for delete using (public.my_role() = 'owner');

-- Public bucket for ad pictures and videos (owner uploads only, 20 MB max)
insert into storage.buckets (id, name, public, file_size_limit)
values ('ads', 'ads', true, 20971520) on conflict (id) do nothing;
create policy "owner uploads ad media" on storage.objects for insert to authenticated
  with check (bucket_id = 'ads' and public.my_role() = 'owner');
create policy "owner deletes ad media" on storage.objects for delete to authenticated
  using (bucket_id = 'ads' and public.my_role() = 'owner');

-- AFTER you sign up on the site, make yourself the owner:
-- update profiles set role = 'owner' where email = 'YOUR_EMAIL_HERE';
