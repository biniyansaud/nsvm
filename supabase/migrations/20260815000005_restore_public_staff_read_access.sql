-- Restore public read access required by security-invoker staff views.
-- This migration is safe to run after the security-hardening migrations.

grant usage on schema public to anon, authenticated;

alter table public.school_staff_members
  add column if not exists published boolean not null default true;
alter table public.secondary_departments
  add column if not exists published boolean not null default true;
alter table public.secondary_staff_members
  add column if not exists published boolean not null default true;

grant select (id, title, description, icon, order_index)
  on public.school_staff_categories to anon, authenticated;
grant select (id, category_id, name, designation, expertise, official_role, image, order_index)
  on public.school_staff_members to anon, authenticated;
grant select (id, title, summary, icon, order_index)
  on public.secondary_departments to anon, authenticated;
grant select (id, department_id, name, designation, subject, image, order_index)
  on public.secondary_staff_members to anon, authenticated;

drop policy if exists staff_categories_public_safe_select on public.school_staff_categories;
drop policy if exists staff_members_public_safe_select on public.school_staff_members;
drop policy if exists secondary_departments_public_safe_select on public.secondary_departments;
drop policy if exists secondary_staff_public_safe_select on public.secondary_staff_members;

create policy staff_categories_public_safe_select
  on public.school_staff_categories for select to anon, authenticated using (true);
create policy staff_members_public_safe_select
  on public.school_staff_members for select to anon, authenticated using (published is true);
create policy secondary_departments_public_safe_select
  on public.secondary_departments for select to anon, authenticated using (published is true);
create policy secondary_staff_public_safe_select
  on public.secondary_staff_members for select to anon, authenticated using (published is true);

alter view public.public_school_staff_categories set (security_invoker = true);
alter view public.public_school_staff_members set (security_invoker = true);
alter view public.public_secondary_departments set (security_invoker = true);
alter view public.public_secondary_staff_members set (security_invoker = true);

grant select on public.public_school_staff_categories,
  public.public_school_staff_members,
  public.public_secondary_departments,
  public.public_secondary_staff_members to anon, authenticated;
