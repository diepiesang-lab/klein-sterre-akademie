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


-- Keep booking capacity checks and writes in one transaction.
create or replace function public.create_booking(p_parent jsonb, p_children jsonb, p_slot_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_capacity integer;
  v_used integer;
  v_child_count integer;
  v_parent_id uuid;
  v_booking_id uuid;
begin
  if jsonb_typeof(p_parent) <> 'object'
     or jsonb_typeof(p_children) <> 'array'
     or jsonb_array_length(p_children) not between 1 and 6
     or coalesce(trim(p_parent->>'first_name'), '') = ''
     or coalesce(trim(p_parent->>'last_name'), '') = ''
     or coalesce(trim(p_parent->>'contact_number'), '') = '' then
    raise exception using errcode = 'P0001', message = 'invalid_booking';
  end if;

  v_child_count := jsonb_array_length(p_children);
  if exists (
    select 1 from jsonb_array_elements(p_children) child
    where coalesce(trim(child->>'first_name'), '') = ''
       or coalesce(trim(child->>'last_name'), '') = ''
       or coalesce(child->>'age', '') !~ '^[0-9]+$'
       or (child->>'age')::integer not between 3 and 18
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_booking';
  end if;

  select capacity into v_capacity from public.slots where id = p_slot_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'slot_not_found';
  end if;

  select coalesce(sum(child_count), 0)::integer into v_used
  from public.bookings where slot_id = p_slot_id and status in ('pending', 'confirmed');
  if v_used + v_child_count > v_capacity then
    raise exception using errcode = 'P0001', message = 'capacity_exceeded';
  end if;

  insert into public.parents(first_name, last_name, contact_number, child_count)
  values (trim(p_parent->>'first_name'), trim(p_parent->>'last_name'),
          trim(p_parent->>'contact_number'), v_child_count)
  returning id into v_parent_id;

  insert into public.children(parent_id, first_name, last_name, age)
  select v_parent_id, trim(child->>'first_name'), trim(child->>'last_name'),
         (child->>'age')::integer
  from jsonb_array_elements(p_children) child;

  insert into public.bookings(parent_id, slot_id, child_count, status)
  values (v_parent_id, p_slot_id, v_child_count, 'pending')
  returning id into v_booking_id;
  return jsonb_build_object('bookingId', v_booking_id);
end;
$$;

create or replace function public.confirm_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_slot_id uuid;
  v_child_count integer;
  v_status text;
  v_capacity integer;
  v_reserved integer;
begin
  select slot_id, child_count, status into v_slot_id, v_child_count, v_status
  from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'booking_not_found';
  end if;
  if v_status = 'confirmed' then return jsonb_build_object('ok', true); end if;
  if v_status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'booking_not_pending';
  end if;

  select capacity into v_capacity from public.slots where id = v_slot_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'slot_not_found';
  end if;
  select coalesce(sum(child_count), 0)::integer into v_reserved
  from public.bookings
  where slot_id = v_slot_id and status in ('pending', 'confirmed') and id <> p_booking_id;
  if v_reserved + v_child_count > v_capacity then
    raise exception using errcode = 'P0001', message = 'capacity_exceeded';
  end if;

  update public.bookings set status = 'confirmed', confirmed_at = now() where id = p_booking_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.create_booking(jsonb, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.confirm_booking(uuid) from public, anon, authenticated;
grant execute on function public.create_booking(jsonb, jsonb, uuid) to service_role;
grant execute on function public.confirm_booking(uuid) to service_role;
