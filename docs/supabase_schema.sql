-- Supabase schema for Kos Anggur Merah (MVP)
-- Run in Supabase SQL editor

create table if not exists room (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  rent_price numeric(12,2) not null,
  status text not null check (status in ('occupied','vacant')),
  tenant_name text,
  due_day smallint not null default 5 check (due_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-month occupant history (effective snapshot). A row means starting that month the tenant_name applies
create table if not exists room_occupancy (
  room_id uuid not null references room(id) on delete cascade,
  month date not null, -- first day of month
  tenant_name text not null,
  created_at timestamptz not null default now(),
  primary key (room_id, month)
);

create table if not exists payment (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references room(id) on delete restrict,
  billing_month date not null, -- first day of month
  due_date date not null,
  amount_due numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  payment_date date,
  method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id, billing_month)
);

create table if not exists expense (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  amount numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists penalty (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references room(id) on delete restrict,
  type text not null check (type in ('overnight_guest','late_payment','custom')),
  custom_description text,
  amount numeric(12,2) not null,
  incident_date date not null,
  paid boolean not null default false,
  paid_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- Basic helper view idea (optional)
-- create view monthly_summary as
-- select date_trunc('month', p.billing_month) as month,
--   sum(p.amount_due) as rent_invoiced,
--   sum(case when p.amount_paid >= p.amount_due then p.amount_due else coalesce(p.amount_paid,0) end) as rent_collected,
--   (select coalesce(sum(amount),0) from penalty pen where date_trunc('month', pen.incident_date)=date_trunc('month', p.billing_month)) as penalties_incurred,
--   (select coalesce(sum(amount),0) from penalty pen where pen.paid and date_trunc('month', pen.incident_date)=date_trunc('month', p.billing_month)) as penalties_collected,
--   (select coalesce(sum(amount),0) from expense e where date_trunc('month', e.date)=date_trunc('month', p.billing_month)) as expenses_total
-- from payment p
-- group by 1
-- order by 1;
