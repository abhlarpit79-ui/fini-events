-- ============================================================
-- FINI Events – Phase 1 schema (event listing + registration)
-- Run in Supabase → SQL Editor (or `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Cities ----------
create table if not exists public.cities (
  id serial primary key,
  name text not null,
  slug text not null unique,
  is_active boolean not null default true
);

insert into public.cities (name, slug, is_active) values
  ('Mumbai', 'mumbai', true),
  ('Navi Mumbai', 'navi-mumbai', true),
  ('Thane', 'thane', true),
  ('Pune', 'pune', false),
  ('Bengaluru', 'bengaluru', false),
  ('Delhi NCR', 'delhi-ncr', false),
  ('Hyderabad', 'hyderabad', false),
  ('Chennai', 'chennai', false),
  ('Ahmedabad', 'ahmedabad', false)
on conflict (slug) do nothing;

-- ---------- Profiles (1 row per auth user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent','professional','admin')),
  full_name text,
  phone text,
  city_id int references public.cities(id),
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup. Role comes from signup metadata (professional signup passes role='professional').
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    case when coalesce(new.raw_user_meta_data->>'role','') = 'professional' then 'professional' else 'parent' end,
    new.raw_user_meta_data->>'full_name',
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper functions ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;


-- ---------- Professionals ----------
create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  category text not null,
  bio text,
  city_id int references public.cities(id),
  area text,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  credentials_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  badge text check (badge in ('verified','expert','parent_favourite')),
  admin_note text,
  created_at timestamptz not null default now()
);

create or replace function public.my_professional_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.professionals where user_id = auth.uid();
$$;

-- ---------- Events ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  age_bands text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz,
  mode text not null default 'venue' check (mode in ('venue','online')),
  venue_name text,
  address text,
  area text,
  city_id int not null references public.cities(id),
  map_url text,
  online_link text,
  capacity int check (capacity is null or capacity > 0),
  fee numeric(10,2) not null default 0,
  fee_note text,
  what_to_bring text,
  image_url text,
  status text not null default 'pending' check (status in ('draft','pending','published','cancelled')),
  is_featured boolean not null default false,
  admin_note text,
  created_at timestamptz not null default now()
);
create index if not exists events_feed_idx on public.events (status, city_id, starts_at);

-- ---------- Registrations ----------
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_name text not null,
  phone text not null,
  child_age_band text not null,
  status text not null default 'registered'
    check (status in ('registered','waitlisted','cancelled','attended','no_show')),
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists registrations_event_idx on public.registrations (event_id, status);

-- ---------- Feedback ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------- Public view: registration counts (no personal data) ----------
create or replace view public.event_counts
with (security_invoker = false) as
  select event_id,
         count(*) filter (where status in ('registered','attended')) as registered_count,
         count(*) filter (where status = 'waitlisted') as waitlisted_count
  from public.registrations
  group by event_id;
grant select on public.event_counts to anon, authenticated;

-- ---------- Atomic registration with capacity / waitlist ----------
create or replace function public.register_for_event(
  p_event_id uuid,
  p_parent_name text,
  p_phone text,
  p_child_age_band text,
  p_opt_in boolean
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_capacity int;
  v_status text;
  v_count int;
  v_new_status text;
begin
  if v_uid is null then raise exception 'Please log in to register'; end if;

  select capacity, status into v_capacity, v_status from public.events where id = p_event_id for update;
  if v_status is distinct from 'published' then raise exception 'This event is not open for registration'; end if;

  select count(*) into v_count from public.registrations
    where event_id = p_event_id and status in ('registered','attended');

  v_new_status := case when v_capacity is not null and v_count >= v_capacity then 'waitlisted' else 'registered' end;

  insert into public.registrations (event_id, user_id, parent_name, phone, child_age_band, status, whatsapp_opt_in)
  values (p_event_id, v_uid, p_parent_name, p_phone, p_child_age_band, v_new_status, p_opt_in)
  on conflict (event_id, user_id) do update
    set status = case when public.registrations.status = 'cancelled' then excluded.status else public.registrations.status end,
        parent_name = excluded.parent_name,
        phone = excluded.phone,
        child_age_band = excluded.child_age_band,
        whatsapp_opt_in = excluded.whatsapp_opt_in
  returning status into v_new_status;

  -- keep profile in sync for next time
  update public.profiles set full_name = p_parent_name, phone = p_phone, whatsapp_opt_in = p_opt_in where id = v_uid;

  return v_new_status;
end $$;

-- When someone cancels, promote the first waitlisted registrant
create or replace function public.promote_waitlist()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_capacity int; v_count int; v_next uuid;
begin
  if new.status = 'cancelled' and old.status in ('registered','attended') then
    select capacity into v_capacity from public.events where id = new.event_id;
    select count(*) into v_count from public.registrations where event_id = new.event_id and status in ('registered','attended');
    if v_capacity is null or v_count < v_capacity then
      select id into v_next from public.registrations
        where event_id = new.event_id and status = 'waitlisted' order by created_at limit 1;
      if v_next is not null then
        update public.registrations set status = 'registered' where id = v_next;
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists on_registration_cancelled on public.registrations;
create trigger on_registration_cancelled
  after update on public.registrations
  for each row execute function public.promote_waitlist();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.feedback enable row level security;

-- cities: public read
create policy "cities public read" on public.cities for select using (true);

-- profiles
create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- professionals
create policy "professionals public read approved" on public.professionals for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "professionals self insert" on public.professionals for insert
  with check (user_id = auth.uid());
create policy "professionals self update" on public.professionals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
              and status = (select p.status from public.professionals p where p.user_id = auth.uid())
              and badge is not distinct from (select p.badge from public.professionals p where p.user_id = auth.uid()));

-- events
create policy "events public read published" on public.events for select
  using (status = 'published' or professional_id = public.my_professional_id() or public.is_admin());
create policy "events pro insert" on public.events for insert
  with check (professional_id = public.my_professional_id()
              and exists (select 1 from public.professionals p where p.id = professional_id and p.status = 'approved'));
create policy "events pro update" on public.events for update
  using (professional_id = public.my_professional_id())
  with check (professional_id = public.my_professional_id()
              and is_featured = (select e.is_featured from public.events e where e.id = events.id)
              and status in ('draft','pending','published','cancelled'));
create policy "events pro delete drafts" on public.events for delete
  using (professional_id = public.my_professional_id() and status in ('draft','pending'));

-- registrations: parent sees own; professional sees registrants of own events; admin all
create policy "registrations parent read" on public.registrations for select
  using (user_id = auth.uid()
         or exists (select 1 from public.events e where e.id = event_id and e.professional_id = public.my_professional_id())
         or public.is_admin());
create policy "registrations parent cancel" on public.registrations for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'cancelled');
create policy "registrations pro attendance" on public.registrations for update
  using (exists (select 1 from public.events e where e.id = event_id and e.professional_id = public.my_professional_id()))
  with check (exists (select 1 from public.events e where e.id = event_id and e.professional_id = public.my_professional_id())
              and status in ('registered','attended','no_show','waitlisted'));
-- inserts only via register_for_event() (security definer)

-- feedback
create policy "feedback read" on public.feedback for select
  using (user_id = auth.uid()
         or exists (select 1 from public.events e where e.id = event_id and e.professional_id = public.my_professional_id())
         or public.is_admin());
create policy "feedback insert own" on public.feedback for insert
  with check (user_id = auth.uid() and exists (
    select 1 from public.registrations r where r.event_id = feedback.event_id and r.user_id = auth.uid() and r.status in ('registered','attended')));
create policy "feedback update own" on public.feedback for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Storage buckets (event images public, credentials private)
-- ============================================================
insert into storage.buckets (id, name, public) values ('event-images', 'event-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('credentials', 'credentials', false) on conflict (id) do nothing;

create policy "event images public read" on storage.objects for select using (bucket_id = 'event-images');
create policy "event images auth upload" on storage.objects for insert
  with check (bucket_id = 'event-images' and auth.role() = 'authenticated');
create policy "credentials owner upload" on storage.objects for insert
  with check (bucket_id = 'credentials' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "credentials owner/admin read" on storage.objects for select
  using (bucket_id = 'credentials' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
