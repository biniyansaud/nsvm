-- ====================================================================
-- SUPABASE COMPLETE PRODUCTION DATABASE SCHEMA & RLS POLICIES FOR NEW SARASWATI VIDYA MANDIR
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Trigger Function to Update `updated_at` Automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- TABLE: admin_users (Admin User Registry)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist if admin_users pre-existed with minimal schema
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Security Definer Helper Function: Check if user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE (
      user_id = auth.uid() 
      OR (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'))
    )
    AND (is_active IS NULL OR is_active = true)
  );
$$;

-- Restrict function execution permissions to authenticated users
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- --------------------------------------------------------------------
-- TABLE: notices
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'notice',
  summary TEXT,
  badge TEXT,
  important BOOLEAN DEFAULT false,
  pdf_url TEXT,
  file_name TEXT,
  ref_no TEXT,
  published_date TEXT,
  salutation TEXT,
  introduction TEXT,
  body TEXT,
  bullet_points JSONB DEFAULT '[]'::jsonb,
  instructions_title TEXT,
  instructions JSONB DEFAULT '[]'::jsonb,
  closing TEXT,
  signatory_name TEXT,
  signatory_title TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------
-- TABLE: gallery
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  "desc" TEXT,
  desc_text TEXT,
  category TEXT NOT NULL DEFAULT 'campus',
  src TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_gallery_updated_at
  BEFORE UPDATE ON public.gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------
-- TABLE: school_staff_categories
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_staff_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Users',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_school_staff_categories_updated_at
  BEFORE UPDATE ON public.school_staff_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------
-- TABLE: school_staff_members
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_staff_members (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.school_staff_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  expertise TEXT,
  official_role TEXT,
  image TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_school_staff_members_updated_at
  BEFORE UPDATE ON public.school_staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------
-- TABLE: secondary_departments (+2 / High School Stream Departments)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.secondary_departments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  icon TEXT DEFAULT 'GraduationCap',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_secondary_departments_updated_at
  BEFORE UPDATE ON public.secondary_departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------
-- TABLE: secondary_staff_members
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.secondary_staff_members (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES public.secondary_departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expertise TEXT,
  image TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_secondary_staff_members_updated_at
  BEFORE UPDATE ON public.secondary_staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Alias table secondary_department_members for backwards compatibility
CREATE TABLE IF NOT EXISTS public.secondary_department_members (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES public.secondary_departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expertise TEXT,
  image TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- TABLE: online_applications (Student Admissions Submissions)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  parent_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  relation TEXT,
  prev_school TEXT,
  see_gpa TEXT,
  program TEXT,
  grade TEXT,
  statement TEXT,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_online_applications_updated_at
  BEFORE UPDATE ON public.online_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------------------
-- TABLE: site_settings & settings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- TABLE: site_content
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- LEGACY TABLES (FOR BACKWARDS COMPATIBILITY)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'School Event',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  expertise TEXT,
  official_role TEXT,
  department TEXT,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Administrative',
  image_url TEXT,
  phone TEXT,
  email TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Syllabus',
  file_url TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT DEFAULT 'PDF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.principal_message (
  id TEXT PRIMARY KEY DEFAULT 'primary_principal_message',
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  quote TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_information (
  id TEXT PRIMARY KEY DEFAULT 'primary_school_info',
  school_name TEXT NOT NULL,
  tagline TEXT,
  establishment_year TEXT,
  affiliation_number TEXT,
  about_text TEXT,
  vision TEXT,
  mission TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_information (
  id TEXT PRIMARY KEY DEFAULT 'primary_contact_info',
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email_primary TEXT NOT NULL,
  email_secondary TEXT,
  address TEXT NOT NULL,
  google_map_embed_url TEXT,
  office_hours TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_staff_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principal_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_information ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (Allow any visitor to view public school content)
CREATE POLICY "Public read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Public read school_staff_categories" ON public.school_staff_categories FOR SELECT USING (true);
CREATE POLICY "Public read school_staff_members" ON public.school_staff_members FOR SELECT USING (true);
CREATE POLICY "Public read secondary_departments" ON public.secondary_departments FOR SELECT USING (true);
CREATE POLICY "Public read secondary_staff_members" ON public.secondary_staff_members FOR SELECT USING (true);
CREATE POLICY "Public read secondary_department_members" ON public.secondary_department_members FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);

CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Public read staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Public read downloads" ON public.downloads FOR SELECT USING (true);
CREATE POLICY "Public read hero_slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Public read principal_message" ON public.principal_message FOR SELECT USING (true);
CREATE POLICY "Public read school_information" ON public.school_information FOR SELECT USING (true);
CREATE POLICY "Public read contact_information" ON public.contact_information FOR SELECT USING (true);

-- 2. Online Applications Security (Public INSERT, Admin READ/UPDATE/DELETE)
CREATE POLICY "Public submit online applications" 
  ON public.online_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin manage online applications" 
  ON public.online_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Admin Users Table Policy (Admins can view and manage admin registry)
CREATE POLICY "Admin access admin_users" 
  ON public.admin_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Admin Write Policies for Content Tables (Only active authorized admin_users)
CREATE POLICY "Admin write notices" ON public.notices FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write gallery" ON public.gallery FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write school_staff_categories" ON public.school_staff_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write school_staff_members" ON public.school_staff_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write secondary_departments" ON public.secondary_departments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write secondary_staff_members" ON public.secondary_staff_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write secondary_department_members" ON public.secondary_department_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write site_settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write site_content" ON public.site_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin write news" ON public.news FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write events" ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write teachers" ON public.teachers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write staff" ON public.staff FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write downloads" ON public.downloads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write hero_slides" ON public.hero_slides FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write principal_message" ON public.principal_message FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write school_information" ON public.school_information FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write contact_information" ON public.contact_information FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ====================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ====================================================================

-- Create buckets for media, gallery, downloads, and hero_slider
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('media', 'media', true),
  ('gallery', 'gallery', true),
  ('downloads', 'downloads', true),
  ('hero_slider', 'hero_slider', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access policies for storage
CREATE POLICY "Public Read Storage Media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Public Read Storage Gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Public Read Storage Downloads" ON storage.objects FOR SELECT USING (bucket_id = 'downloads');
CREATE POLICY "Public Read Storage Hero" ON storage.objects FOR SELECT USING (bucket_id = 'hero_slider');

-- Authenticated Admin upload & delete policies for storage
CREATE POLICY "Admin Upload Media Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin Delete Media Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin Upload Gallery Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin Delete Gallery Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin Upload Downloads Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin Delete Downloads Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admin Upload Hero Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin Delete Hero Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());


-- ====================================================================
-- SEED DEFAULT DATA
-- ====================================================================

INSERT INTO public.school_information (id, school_name, tagline, establishment_year, affiliation_number, about_text)
VALUES (
  'primary_school_info',
  'New Saraswati Vidya Mandir',
  'Excellence in Education, Values for Life',
  '2060 B.S.',
  'NEB-NSVM-402',
  'New Saraswati Vidya Mandir is a premier educational institution committed to modern academic standards, holistic character building, and community leadership.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contact_information (id, phone_primary, email_primary, address)
VALUES (
  'primary_contact_info',
  '+977 9800000000',
  'info@newsaraswati.edu.np',
  'Mahendranagar, Kanchanpur, Nepal'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.principal_message (id, name, title, message)
VALUES (
  'primary_principal_message',
  'Amraj Bhatt',
  'Principal',
  'Welcome to New Saraswati Vidya Mandir. Our focus is to nurture curiosity, foster high intellectual capability, and instill lifelong core values in every child.'
) ON CONFLICT (id) DO NOTHING;
