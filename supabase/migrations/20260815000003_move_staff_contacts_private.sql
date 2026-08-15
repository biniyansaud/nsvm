-- Preserve contact details outside the public staff directory, then make the
-- public directory views security-invoker without exposing personal contacts.
create table if not exists private.staff_contacts (
  source_table text not null check (source_table in ('school_staff_members', 'secondary_staff_members')),
  staff_id text not null,
  email text,
  phone text,
  primary key (source_table, staff_id)
);

insert into private.staff_contacts (source_table, staff_id, email, phone)
select 'school_staff_members', id, email, phone from public.school_staff_members
where nullif(email, '') is not null or nullif(phone, '') is not null
on conflict (source_table, staff_id) do update set email = excluded.email, phone = excluded.phone;

insert into private.staff_contacts (source_table, staff_id, email, phone)
select 'secondary_staff_members', id, email, phone from public.secondary_staff_members
where nullif(email, '') is not null or nullif(phone, '') is not null
on conflict (source_table, staff_id) do update set email = excluded.email, phone = excluded.phone;

alter table public.school_staff_members drop column if exists email, drop column if exists phone;
alter table public.secondary_staff_members drop column if exists email, drop column if exists phone;

grant select on public.school_staff_categories, public.school_staff_members,
  public.secondary_departments, public.secondary_staff_members to anon, authenticated;
