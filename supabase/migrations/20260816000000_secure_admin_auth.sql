-- Secure Supabase-native admin authorization.
-- Authentication remains in auth.users; this table only maps an auth UUID to
-- an application role and active status.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and is_active is true
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop function if exists private.is_admin();

alter table public.admin_users enable row level security;
drop policy if exists "Admin access admin_users" on public.admin_users;

-- Admin identity records are readable only by an already-authorized admin.
-- There is intentionally no client INSERT/UPDATE/DELETE policy. Provisioning
-- and role changes must happen through a trusted SQL/admin workflow.
create policy "Admins can read admin_users"
  on public.admin_users
  for select
  to authenticated
  using (public.is_admin());
