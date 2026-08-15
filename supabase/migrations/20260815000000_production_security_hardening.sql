-- Align live access controls with the production client and protect staff PII.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and is_active is true
  );
$$;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
alter function public.sync_gallery_description_fields() set search_path = public, pg_temp;
revoke all on function public.sync_gallery_description_fields() from public, anon, authenticated;

alter table public.secondary_staff_members
  add column if not exists published boolean not null default true;

-- Public pages only receive fields that are intended for publication. The base
-- tables remain readable and writable only by active administrators through RLS.
create or replace view public.public_school_staff_categories as
  select id, title, description, icon, order_index
  from public.school_staff_categories;

create or replace view public.public_school_staff_members as
  select id, category_id, name, designation, expertise, official_role, image, order_index
  from public.school_staff_members
  where published is true;

create or replace view public.public_secondary_departments as
  select id, title, summary, icon, order_index
  from public.secondary_departments
  where published is true;

create or replace view public.public_secondary_staff_members as
  select id, department_id, name, coalesce(subject, designation, '') as expertise, image, order_index
  from public.secondary_staff_members
  where published is true;

alter view public.public_school_staff_categories set (security_invoker = true);
alter view public.public_school_staff_members set (security_invoker = true);
alter view public.public_secondary_departments set (security_invoker = true);
alter view public.public_secondary_staff_members set (security_invoker = true);

grant select on public.public_school_staff_categories,
  public.public_school_staff_members,
  public.public_secondary_departments,
  public.public_secondary_staff_members to anon, authenticated;

drop policy if exists staff_categories_anon_select on public.school_staff_categories;
drop policy if exists staff_members_anon_select on public.school_staff_members;
drop policy if exists secondary_departments_anon_select on public.secondary_departments;
drop policy if exists secondary_members_anon_select on public.secondary_department_members;
drop policy if exists secondary_staff_public_select on public.secondary_staff_members;

grant select (id, title, description, icon, order_index) on public.school_staff_categories to anon, authenticated;
grant select (id, category_id, name, designation, expertise, official_role, image, order_index) on public.school_staff_members to anon, authenticated;
grant select (id, title, summary, icon, order_index) on public.secondary_departments to anon, authenticated;
grant select (id, department_id, name, designation, subject, image, order_index) on public.secondary_staff_members to anon, authenticated;

create policy staff_categories_public_safe_select on public.school_staff_categories for select to anon, authenticated using (true);
create policy staff_members_public_safe_select on public.school_staff_members for select to anon, authenticated using (published is true);
create policy secondary_departments_public_safe_select on public.secondary_departments for select to anon, authenticated using (published is true);
create policy secondary_staff_public_safe_select on public.secondary_staff_members for select to anon, authenticated using (published is true);

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id in ('media', 'uploads', 'cms-media');
