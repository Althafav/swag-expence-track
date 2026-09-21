-- Recycle bin: soft delete for projects and transactions.
-- Run once in the Supabase SQL Editor. Additive and nullable, so it is safe to
-- run BEFORE deploying the code that uses it (old code just ignores the column).
-- NULL = live; a timestamp = in the recycle bin since that moment.

alter table projects     add column if not exists "deletedAt" timestamptz;
alter table transactions add column if not exists "deletedAt" timestamptz;

create index if not exists projects_deleted_at_idx     on projects ("deletedAt");
create index if not exists transactions_deleted_at_idx on transactions ("deletedAt");
