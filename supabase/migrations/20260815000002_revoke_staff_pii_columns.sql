-- Data API roles may inherit broad table grants. Replace them with explicit
-- safe-column reads so staff contact details are never public.
revoke select on public.school_staff_categories, public.school_staff_members,
  public.secondary_departments, public.secondary_staff_members from public, anon, authenticated;

grant select (id, title, description, icon, order_index) on public.school_staff_categories to anon, authenticated;
grant select (id, category_id, name, designation, expertise, official_role, image, order_index) on public.school_staff_members to anon, authenticated;
grant select (id, title, summary, icon, order_index) on public.secondary_departments to anon, authenticated;
grant select (id, department_id, name, designation, subject, image, order_index) on public.secondary_staff_members to anon, authenticated;
