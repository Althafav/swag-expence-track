-- Completed date for projects.
-- Run once in the Supabase SQL Editor. Additive and nullable, so it is safe to
-- run BEFORE deploying the code that uses it (old code just ignores the column).
-- Only meaningful while status = 'completed'; the app clears it otherwise.

alter table projects add column if not exists "completedDate" date;
