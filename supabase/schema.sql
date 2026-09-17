-- Klein Sterre Akademie database
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  contact_number text not null,
  child_count integer not null check (child_count between 1 and 6),
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  age integer not null check (age between 3 and 18),
  created_at timestamptz not null default now()
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_time time not null,
  capacity integer not null default 3 check (capacity between 1 and 20),
  created_at timestamptz not null default now(),
  unique(session_date, session_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  slot_id uuid not null references public.slots(id) on delete cascade,
  child_count integer not null check (child_count between 1 and 6),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','cancelled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists children_parent_id_idx on public.children(parent_id);
create index if not exists slots_date_idx on public.slots(session_date);
create index if not exists bookings_slot_id_idx on public.bookings(slot_id);
create index if not exists bookings_status_idx on public.bookings(status);

alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;

revoke all on public.parents, public.children, public.slots, public.bookings from anon, authenticated;
grant select, insert, update, delete on public.parents, public.children, public.slots, public.bookings to service_role;
