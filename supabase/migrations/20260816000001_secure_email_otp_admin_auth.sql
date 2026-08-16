-- Server-managed email OTP state. No anon/authenticated grants are given;
-- the Vercel server uses the Supabase service role for this table.
create table if not exists public.admin_otp_challenges (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_otp_challenges_user_idx
  on public.admin_otp_challenges (user_id, created_at desc);

alter table public.admin_otp_challenges enable row level security;
revoke all on public.admin_otp_challenges from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
      and a.is_active is true
      and a.role = 'admin'
      and exists (
        select 1
        from public.admin_otp_challenges c
        where c.user_id = auth.uid()
          and c.consumed_at is not null
          and c.consumed_at > now() - interval '30 days'
      )
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
