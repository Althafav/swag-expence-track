-- Company expenses: transactions that belong to the whole business, not a project
-- (salaries, marketing, office rent, ...). A transaction with "projectId" NULL is
-- a company entry. Run once in the Supabase SQL Editor. Additive, so it is safe
-- to run BEFORE deploying the code that uses it (old code never writes NULL).

alter table transactions alter column "projectId" drop not null;

create index if not exists transactions_company_idx on transactions ("date") where "projectId" is null;
