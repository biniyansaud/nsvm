-- Run this once in the Supabase SQL Editor if your valid Auth account cannot publish.
-- Replace the placeholder with the exact email address used to sign in at /admin.
-- This is intentionally a manual, one-time bootstrap: public browser code must never
-- be allowed to create its own administrator account.

insert into public.admin_users (user_id, email, role, is_active)
select id, lower(email), 'admin', true
from auth.users
where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL')
on conflict (email) do update
set user_id = excluded.user_id,
    role = 'admin',
    is_active = true;

-- Verify the account was provisioned (should return one active row).
select user_id, email, role, is_active
from public.admin_users
where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL');
