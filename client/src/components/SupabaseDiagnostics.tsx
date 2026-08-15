import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Server, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TableHealth {
  name: string;
  status: "healthy" | "error" | "loading";
  count: number | null;
  error?: string;
  latencyMs?: number;
}

interface BucketHealth {
  name: string;
  status: "healthy" | "error" | "loading";
  error?: string;
}

const REQUIRED_TABLES = [
  "admin_users",
  "notices",
  "gallery",
  "school_staff_categories",
  "school_staff_members",
  "secondary_departments",
  "secondary_staff_members",
  "online_applications",
  "site_content",
  "site_settings",
  "settings",
  "school_information",
  "contact_information",
  "principal_message"
];

const REQUIRED_BUCKETS = ["media", "gallery", "downloads", "hero_slider"];

export const SupabaseDiagnostics: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "failed">("checking");
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [tablesHealth, setTablesHealth] = useState<Record<string, TableHealth>>({});
  const [bucketsHealth, setBucketsHealth] = useState<Record<string, BucketHealth>>({});
  const [copiedSql, setCopiedSql] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const runDiagnostics = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setConnectionStatus("failed");
      const unconfigTables: Record<string, TableHealth> = {};
      REQUIRED_TABLES.forEach(t => {
        unconfigTables[t] = { name: t, status: "error", count: null, error: "Optional Supabase not configured (using Express Local DB)" };
      });
      setTablesHealth(unconfigTables);

      const unconfigBuckets: Record<string, BucketHealth> = {};
      REQUIRED_BUCKETS.forEach(b => {
        unconfigBuckets[b] = { name: b, status: "error", error: "Optional Supabase storage unconfigured (using Local Uploads)" };
      });
      setBucketsHealth(unconfigBuckets);
      return;
    }

    setConnectionStatus("checking");

    const startTime = performance.now();

    try {
      // Test 1: Overall Connection Ping
      const { data: pingData, error: pingError } = await supabase.from("school_information").select("id").limit(1);
      const duration = Math.round(performance.now() - startTime);
      setPingTime(duration);

      if (pingError && pingError.code !== "PGRST116" && pingError.code !== "42P01") {
        setConnectionStatus("failed");
      } else {
        setConnectionStatus("connected");
      }

      // Test 2: Check each table health
      const tableResults: Record<string, TableHealth> = {};
      for (const table of REQUIRED_TABLES) {
        const tStart = performance.now();
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        const tLatency = Math.round(performance.now() - tStart);

        if (error) {
          tableResults[table] = {
            name: table,
            status: "error",
            count: null,
            error: `${error.code || ''}: ${error.message}`,
            latencyMs: tLatency
          };
        } else {
          tableResults[table] = {
            name: table,
            status: "healthy",
            count: count ?? 0,
            latencyMs: tLatency
          };
        }
      }
      setTablesHealth(tableResults);

      // Test 3: Check storage buckets
      const bucketResults: Record<string, BucketHealth> = {};
      for (const bucket of REQUIRED_BUCKETS) {
        const { error } = await supabase.storage.from(bucket).list("", { limit: 1 });
        if (error) {
          bucketResults[bucket] = {
            name: bucket,
            status: "error",
            error: error.message
          };
        } else {
          bucketResults[bucket] = {
            name: bucket,
            status: "healthy"
          };
        }
      }
      setBucketsHealth(bucketResults);

    } catch (err) {
      setConnectionStatus("failed");
      console.error("Supabase diagnostic error:", err);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const healthyTablesCount = Object.values(tablesHealth).filter(t => t.status === "healthy").length;
  const healthyBucketsCount = Object.values(bucketsHealth).filter(b => b.status === "healthy").length;
  const totalTables = REQUIRED_TABLES.length;
  const totalBuckets = REQUIRED_BUCKETS.length;

  const copySqlSchema = () => {
    const sqlText = `-- ====================================================================
-- SUPABASE COMPLETE PRODUCTION DATABASE SCHEMA & RLS POLICIES FOR NEW SARASWATI VIDYA MANDIR
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Trigger Function to Update updated_at Automatically
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

-- Ensure all required columns exist
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

-- --------------------------------------------------------------------
-- TABLE: secondary_departments
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
-- TABLE: online_applications
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

-- --------------------------------------------------------------------
-- TABLE: site_settings, settings, site_content
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

CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
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

CREATE TABLE IF NOT EXISTS public.principal_message (
  id TEXT PRIMARY KEY DEFAULT 'primary_principal_message',
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  quote TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Policies
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
ALTER TABLE public.school_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principal_message ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Public read notices" ON public.notices;
CREATE POLICY "Public read notices" ON public.notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read school_staff_categories" ON public.school_staff_categories;
CREATE POLICY "Public read school_staff_categories" ON public.school_staff_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read school_staff_members" ON public.school_staff_members;
CREATE POLICY "Public read school_staff_members" ON public.school_staff_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read secondary_departments" ON public.secondary_departments;
CREATE POLICY "Public read secondary_departments" ON public.secondary_departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read secondary_staff_members" ON public.secondary_staff_members;
CREATE POLICY "Public read secondary_staff_members" ON public.secondary_staff_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read secondary_department_members" ON public.secondary_department_members;
CREATE POLICY "Public read secondary_department_members" ON public.secondary_department_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read site_content" ON public.site_content;
CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read school_information" ON public.school_information;
CREATE POLICY "Public read school_information" ON public.school_information FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read contact_information" ON public.contact_information;
CREATE POLICY "Public read contact_information" ON public.contact_information FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read principal_message" ON public.principal_message;
CREATE POLICY "Public read principal_message" ON public.principal_message FOR SELECT USING (true);

-- Online Applications Public Insert & Admin All
DROP POLICY IF EXISTS "Public submit online applications" ON public.online_applications;
CREATE POLICY "Public submit online applications" ON public.online_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage online applications" ON public.online_applications;
CREATE POLICY "Admin manage online applications" ON public.online_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin Users Access
DROP POLICY IF EXISTS "Admin access admin_users" ON public.admin_users;
CREATE POLICY "Admin access admin_users" ON public.admin_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin Write Policies
DROP POLICY IF EXISTS "Admin write notices" ON public.notices;
CREATE POLICY "Admin write notices" ON public.notices FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write gallery" ON public.gallery;
CREATE POLICY "Admin write gallery" ON public.gallery FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write school_staff_categories" ON public.school_staff_categories;
CREATE POLICY "Admin write school_staff_categories" ON public.school_staff_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write school_staff_members" ON public.school_staff_members;
CREATE POLICY "Admin write school_staff_members" ON public.school_staff_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write secondary_departments" ON public.secondary_departments;
CREATE POLICY "Admin write secondary_departments" ON public.secondary_departments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write secondary_staff_members" ON public.secondary_staff_members;
CREATE POLICY "Admin write secondary_staff_members" ON public.secondary_staff_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write secondary_department_members" ON public.secondary_department_members;
CREATE POLICY "Admin write secondary_department_members" ON public.secondary_department_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write site_settings" ON public.site_settings;
CREATE POLICY "Admin write site_settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
CREATE POLICY "Admin write settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write site_content" ON public.site_content;
CREATE POLICY "Admin write site_content" ON public.site_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('media', 'media', true),
  ('gallery', 'gallery', true),
  ('downloads', 'downloads', true),
  ('hero_slider', 'hero_slider', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Storage Media" ON storage.objects;
CREATE POLICY "Public Read Storage Media" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Public Read Storage Gallery" ON storage.objects;
CREATE POLICY "Public Read Storage Gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public Read Storage Downloads" ON storage.objects;
CREATE POLICY "Public Read Storage Downloads" ON storage.objects FOR SELECT USING (bucket_id = 'downloads');

DROP POLICY IF EXISTS "Public Read Storage Hero" ON storage.objects;
CREATE POLICY "Public Read Storage Hero" ON storage.objects FOR SELECT USING (bucket_id = 'hero_slider');

DROP POLICY IF EXISTS "Admin Upload Media Storage" ON storage.objects;
CREATE POLICY "Admin Upload Media Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Media Storage" ON storage.objects;
CREATE POLICY "Admin Delete Media Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admin Upload Gallery Storage" ON storage.objects;
CREATE POLICY "Admin Upload Gallery Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Gallery Storage" ON storage.objects;
CREATE POLICY "Admin Delete Gallery Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admin Upload Downloads Storage" ON storage.objects;
CREATE POLICY "Admin Upload Downloads Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Downloads Storage" ON storage.objects;
CREATE POLICY "Admin Delete Downloads Storage" ON storage.objects FOR DELETE TO authenticated USING (public.is_admin());

-- Seed Default Info
INSERT INTO public.school_information (id, school_name, tagline, establishment_year, affiliation_number, about_text)
VALUES (
  'primary_school_info',
  'New Saraswati Vidya Mandir Secondary School',
  'Quality | Confidence | Character',
  '2060 B.S.',
  'NEB-NSVM-402',
  'New Saraswati Vidya Mandir is a premier educational institution committed to modern academic standards and holistic character building.'
) ON CONFLICT (id) DO NOTHING;
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="my-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 bg-slate-900 text-white cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm tracking-wide text-slate-100">Database & Storage Diagnostics</h3>
              {connectionStatus === "connected" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Live ({pingTime}ms)
                </span>
              )}
              {connectionStatus === "failed" && !isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  Local Server Store Active
                </span>
              )}
              {connectionStatus === "failed" && isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Supabase Sync Offline
                </span>
              )}
              {connectionStatus === "checking" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Checking status...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isSupabaseConfigured
                ? `Tables Healthy: ${healthyTablesCount}/${totalTables} | Storage Buckets: ${healthyBucketsCount}/${totalBuckets}`
                : "Primary database: Local JSON Content Store (/data/content.json). Supabase is optional."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              runDiagnostics();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Re-run Diagnostics"
          >
            <RefreshCw className={`h-4 w-4 ${connectionStatus === "checking" ? "animate-spin text-teal-400" : ""}`} />
          </button>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 space-y-6 bg-slate-50/50">
          {/* Top Quick Status Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
              <Server className="h-5 w-5 text-teal-600 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-500">Supabase Connection</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {connectionStatus === "connected" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Connected
                    </>
                  ) : connectionStatus === "checking" ? (
                    "Testing..."
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-rose-500" /> Disconnected
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
              <Database className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-500">Database Schema Health</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {healthyTablesCount === totalTables ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% All Tables Ready
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> {healthyTablesCount}/{totalTables} Tables Online
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-sky-600 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-500">Storage Buckets Health</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {healthyBucketsCount === totalBuckets ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> All Buckets Operational
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> {healthyBucketsCount}/{totalBuckets} Buckets Active
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tables Diagnostic Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-4 w-4 text-teal-600" /> Required Database Tables ({totalTables})
              </h4>
              <button
                onClick={copySqlSchema}
                className="text-xs flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold bg-teal-50 border border-teal-200 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedSql ? "SQL Copied to Clipboard!" : "Copy Full SQL Schema"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {REQUIRED_TABLES.map((tName) => {
                const health = tablesHealth[tName];
                const isOk = health?.status === "healthy";
                const isLoading = health?.status === "loading";

                return (
                  <div
                    key={tName}
                    className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      isOk
                        ? "bg-emerald-50/40 border-emerald-200 text-slate-900"
                        : isLoading
                        ? "bg-slate-100/60 border-slate-200 text-slate-500 animate-pulse"
                        : "bg-rose-50/60 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-xs mb-1">
                      <span className="truncate">{tName}</span>
                      {isOk && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      {!isOk && !isLoading && <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                    </div>

                    <div className="text-[0.7rem] text-slate-600 flex items-center justify-between mt-1">
                      {isOk ? (
                        <>
                          <span className="font-semibold text-emerald-700">{health.count} records</span>
                          <span className="text-slate-400">{health.latencyMs}ms</span>
                        </>
                      ) : isLoading ? (
                        <span>Checking...</span>
                      ) : (
                        <span className="text-rose-600 font-medium truncate" title={health?.error}>
                          {health?.error || "Missing table / RLS error"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buckets Diagnostic Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-sky-600" /> Storage Buckets ({totalBuckets})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {REQUIRED_BUCKETS.map((bName) => {
                const health = bucketsHealth[bName];
                const isOk = health?.status === "healthy";
                const isLoading = health?.status === "loading";

                return (
                  <div
                    key={bName}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      isOk
                        ? "bg-sky-50/40 border-sky-200 text-slate-900"
                        : isLoading
                        ? "bg-slate-100 border-slate-200 text-slate-500"
                        : "bg-rose-50/60 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono font-bold text-xs">
                      <HardDrive className="h-3.5 w-3.5 text-sky-600" />
                      <span>{bName}</span>
                    </div>

                    <div>
                      {isOk && <span className="text-[0.7rem] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Ready</span>}
                      {!isOk && !isLoading && <span className="text-[0.7rem] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Missing</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions Footer */}
          {healthyTablesCount < totalTables && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Setup Instructions:</span> If any tables show missing, click "Copy Full SQL Schema" above, open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-amber-950 inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="h-3 w-3" /></a>, paste into the SQL Editor and click Run.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
