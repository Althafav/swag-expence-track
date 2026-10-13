-- Quotations: client quotes with line items, plus a catalogue of reusable items.
-- Run once in the Supabase SQL Editor. Additive (new tables only), so it is safe
-- to run BEFORE deploying the code that uses it.
--
-- Line items live in a jsonb column ([{ description, qty, unit, rate }, ...])
-- rather than a child table: a quote is always read and saved whole, and one
-- column keeps every save a single atomic UPDATE through PostgREST.

create table if not exists quotes (
  id text primary key,
  "number" text not null unique,
  "clientName" text not null,
  "clientPhone" text,
  site text,
  date date not null,
  "validUntil" date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  items jsonb not null default '[]'::jsonb,
  "discountType" text check ("discountType" in ('flat', 'percent')),
  "discountValue" numeric not null default 0,
  notes text,
  terms text,
  "createdAt" timestamptz not null default now(),
  "deletedAt" timestamptz
);

-- The project a quote turned into (optional). Its type has to match projects.id,
-- which isn't recorded in this repo, so read it from the catalog.
do $$
declare id_type text;
begin
  select data_type into id_type from information_schema.columns
  where table_schema = 'public' and table_name = 'projects' and column_name = 'id';
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes' and column_name = 'projectId'
  ) then
    execute format(
      'alter table quotes add column "projectId" %s references projects(id) on delete set null',
      case when id_type = 'uuid' then 'uuid' else 'text' end
    );
  end if;
end $$;

create index if not exists quotes_deleted_at_idx on quotes ("deletedAt");
create index if not exists quotes_status_idx on quotes (status);

create table if not exists catalogue_items (
  id text primary key,
  name text not null,
  unit text not null default '',
  rate numeric not null default 0,
  "createdAt" timestamptz not null default now()
);
