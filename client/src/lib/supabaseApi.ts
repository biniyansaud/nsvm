import { supabase, isSupabaseConfigured } from "./supabase";

// ==========================================
// Database Record Types (Current Schema)
// ==========================================

export interface SupabaseGalleryItem {
  id: string;
  title: string;
  desc?: string;
  category: "campus" | "learning" | "activities" | "events";
  src: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseNotice {
  id: string | number;
  title: string;
  date: string;
  category: "General" | "Exam" | "Admission" | "Event" | "Urgent" | "Academic" | "notice" | "exam" | "event";
  summary?: string;
  badge?: string;
  important?: boolean;
  pdf_url?: string;
  file_name?: string;
  ref_no?: string;
  published_date?: string;
  salutation?: string;
  introduction?: string;
  body?: string;
  bullet_points?: string[];
  instructions_title?: string;
  instructions?: string[];
  closing?: string;
  signatory_name?: string;
  signatory_title?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseSchoolStaffCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseSchoolStaffMember {
  id: string;
  category_id?: string;
  name: string;
  designation: string;
  expertise?: string;
  official_role?: string;
  image?: string;
  image_url?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseSecondaryDepartment {
  id: string;
  title: string;
  summary?: string;
  icon?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseSecondaryStaffMember {
  id: string;
  department_id?: string;
  name: string;
  expertise: string;
  image?: string;
  image_url?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseSiteSetting {
  id?: string;
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface SupabaseOnlineApplication {
  id: string;
  full_name: string;
  parent_name?: string;
  phone: string;
  email?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  relation?: string;
  prev_school?: string;
  see_gpa?: string;
  program?: string;
  grade?: string;
  statement?: string;
  remarks?: string;
  status?: "pending" | "reviewed" | "approved" | "rejected";
  submitted_at?: string;
  created_at?: string;
}

export interface SupabaseAdminUser {
  id: string;
  email: string;
  role?: string;
  user_id?: string;
  is_active?: boolean;
  created_at?: string;
}

// Backwards-compatible legacy interface aliases
export interface SupabaseTeacher extends SupabaseSchoolStaffMember {}
export interface SupabaseSchoolInfo {
  id?: string;
  school_name: string;
  tagline?: string;
  location?: string;
  contact?: string;
  email?: string;
  updated_at?: string;
}

// ==========================================
// Storage Helpers (Bucket: media)
// ==========================================

export async function uploadFileToSupabase(
  file: File,
  folder: "gallery" | "staff" | "principal" | "notices" = "gallery"
): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP images and PDF documents are allowed.");
  }
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("Files must be between 1 byte and 10 MB.");
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in as an administrator before uploading files.");

  const fileExt = file.name.split(".").pop() || "jpg";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 30);
  const fileName = `${folder}/${cleanName}_${Date.now()}.${fileExt}`;

  // Primary bucket specified by task requirements: 'media'
  const bucketName = "media";

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.warn(`Upload to bucket '${bucketName}' failed, trying fallback:`, uploadError.message);
    // Fallback to legacy buckets if bucket 'media' is not provisioned yet
    const fallbackBucket = folder === "notices" ? "downloads" : "gallery";
    const fallbackPath = `${folder}_${Date.now()}.${fileExt}`;
    const { error: fbErr } = await supabase.storage
      .from(fallbackBucket)
      .upload(fallbackPath, file, { cacheControl: "3600", upsert: false });

    if (fbErr) throw new Error(`Upload failed in '${bucketName}' (${uploadError.message}) and '${fallbackBucket}' (${fbErr.message}).`);

    const { data: fbData } = supabase.storage.from(fallbackBucket).getPublicUrl(fallbackPath);
    return fbData.publicUrl;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadGalleryImage(file: File): Promise<string> {
  return uploadFileToSupabase(file, "gallery");
}

export async function uploadStaffPhoto(file: File): Promise<string> {
  return uploadFileToSupabase(file, "staff");
}

export async function uploadPrincipalPhoto(file: File): Promise<string> {
  return uploadFileToSupabase(file, "principal");
}

export async function uploadPDFDocument(file: File): Promise<string> {
  return uploadFileToSupabase(file, "notices");
}

export async function deleteStorageFile(fileUrl: string, bucket = "media"): Promise<boolean> {
  if (!supabase || !fileUrl) return false;

  try {
    const urlParts = fileUrl.split(`${bucket}/`);
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      return !error;
    }
  } catch (err) {
    console.error("Failed to delete storage file:", err);
  }
  return false;
}

// ==========================================
// Gallery CRUD (Table: gallery)
// ==========================================

export async function fetchGalleryFromSupabase(): Promise<SupabaseGalleryItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase fetch gallery warning:", error.message);
    return [];
  }
  return (data || []).map((item) => ({
    id: String(item.id),
    title: item.title || "Untitled Image",
    desc: item.description || item.desc || "",
    category: (item.category || "campus") as SupabaseGalleryItem["category"],
    src: item.src || item.image_url || item.url || "",
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function saveGalleryItemToSupabase(
  item: Partial<SupabaseGalleryItem>
): Promise<SupabaseGalleryItem | null> {
  if (!supabase) return null;

  const validId = item.id && String(item.id).trim() !== "" ? String(item.id).trim() : undefined;
  const payload: Record<string, any> = {
    ...(validId ? { id: validId } : {}),
    title: item.title || "Untitled Image",
    category: item.category || "campus",
    src: item.src || "",
    description: item.desc || "",
  };

  const { data, error } = await supabase.from("gallery").upsert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGalleryItemFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ==========================================
// Notices CRUD (Table: notices)
// ==========================================

export async function fetchNoticesFromSupabase(): Promise<SupabaseNotice[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase fetch notices warning:", error.message);
    return [];
  }
  return (data || []).map((item) => {
    const content = item.content || {};
    return {
    id: item.id,
    title: item.title || "School Notice",
    date: item.date || item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    category: item.category || "notice",
    summary: item.excerpt || item.summary || content.introduction || "",
    badge: item.badge || "",
    important: item.is_important ?? item.important ?? false,
    pdf_url: item.attachment_url || item.pdf || "",
    file_name: item.attachment_name || "",
    ref_no: content.refNo || item.ref_no || "",
    published_date: content.publishedDate || item.published_date || item.date || "",
    salutation: content.salutation || item.salutation || "",
    introduction: content.introduction || item.introduction || item.excerpt || "",
    body: content.body || item.body || item.excerpt || "",
    bullet_points: Array.isArray(content.bulletPoints) ? content.bulletPoints : [],
    instructions_title: content.instructionsTitle || "",
    instructions: Array.isArray(content.instructions) ? content.instructions : [],
    closing: content.closing || "",
    signatory_name: content.signatoryName || "",
    signatory_title: content.signatoryTitle || "",
    attachment_url: item.attachment_url || "",
    attachment_name: item.attachment_name || "",
    created_at: item.created_at,
    updated_at: item.updated_at,
    };
  });
}

export async function saveNoticeToSupabase(notice: Partial<SupabaseNotice>): Promise<SupabaseNotice | null> {
  if (!supabase) return null;

  const validId = notice.id && String(notice.id).trim() !== "" ? String(notice.id).trim() : undefined;
  const payload: Record<string, any> = {
    ...(validId ? { id: validId } : {}),
    title: notice.title || "School Notice",
    date: notice.date || new Date().toISOString().slice(0, 10),
    category: String(notice.category || "notice").toLowerCase(),
    excerpt: notice.summary || notice.introduction || notice.body || notice.title || "",
    content: {
      refNo: notice.ref_no || "",
      publishedDate: notice.published_date || notice.date || "",
      salutation: notice.salutation || "",
      introduction: notice.introduction || notice.summary || "",
      body: notice.body || notice.summary || "",
      bulletPoints: notice.bullet_points || [],
      instructionsTitle: notice.instructions_title || "",
      instructions: notice.instructions || [],
      closing: notice.closing || "",
      signatoryName: notice.signatory_name || "",
      signatoryTitle: notice.signatory_title || "",
    },
    attachment_url: notice.attachment_url || notice.pdf_url || "",
    attachment_name: notice.attachment_name || notice.file_name || "",
    is_important: Boolean(notice.important),
    pdf: notice.pdf_url || notice.attachment_url || "",
  };

  const { data, error } = await supabase.from("notices").upsert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteNoticeFromSupabase(id: string | number): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ==========================================
// School Staff CRUD (Tables: school_staff_categories & school_staff_members)
// ==========================================

export async function fetchSchoolStaffCategoriesFromSupabase(): Promise<SupabaseSchoolStaffCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("public_school_staff_categories")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    console.warn("Supabase fetch school_staff_categories warning:", error.message);
    return [];
  }
  return data || [];
}

export async function saveSchoolStaffCategoryToSupabase(
  category: Partial<SupabaseSchoolStaffCategory>
): Promise<SupabaseSchoolStaffCategory | null> {
  if (!supabase) return null;
  const payload = {
    id: category.id,
    title: category.title || "Staff",
    description: category.description || "",
    icon: category.icon || "Users",
    order_index: category.display_order || 0,
  };
  const { data, error } = await supabase
    .from("school_staff_categories")
    .upsert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSchoolStaffCategoryFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("school_staff_categories").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function fetchSchoolStaffMembersFromSupabase(): Promise<SupabaseSchoolStaffMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("public_school_staff_members")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    console.warn("Supabase fetch school_staff_members warning:", error.message);
    return [];
  }
  return (data || []).map((m) => ({
    ...m,
    image: m.image || m.image_url || "",
  }));
}

export async function saveSchoolStaffMemberToSupabase(
  member: Partial<SupabaseSchoolStaffMember>
): Promise<SupabaseSchoolStaffMember | null> {
  if (!supabase) return null;
  const payload = {
    id: member.id,
    category_id: member.category_id,
    name: member.name || "Staff member",
    designation: member.designation || "Teacher",
    role: member.designation || "Teacher",
    expertise: member.expertise || "",
    official_role: member.official_role || member.designation || "Teacher",
    image: member.image || member.image_url || "",
    order_index: member.display_order || 0,
  };
  const { error } = await supabase.from("school_staff_members").upsert([payload]);
  if (error) throw error;
  return payload as SupabaseSchoolStaffMember;
}

export async function deleteSchoolStaffMemberFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("school_staff_members").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ==========================================
// Secondary Staff CRUD (Tables: secondary_departments & secondary_staff_members)
// ==========================================

export async function fetchSecondaryDepartmentsFromSupabase(): Promise<SupabaseSecondaryDepartment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("public_secondary_departments")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    console.warn("Supabase fetch secondary_departments warning:", error.message);
    return [];
  }
  return data || [];
}

export async function saveSecondaryDepartmentToSupabase(
  dept: Partial<SupabaseSecondaryDepartment>
): Promise<SupabaseSecondaryDepartment | null> {
  if (!supabase) return null;
  const payload = {
    id: dept.id,
    title: dept.title || "Department",
    name: dept.title || "Department",
    summary: dept.summary || "",
    icon: dept.icon || "GraduationCap",
    order_index: dept.display_order || 0,
  };
  const { data, error } = await supabase
    .from("secondary_departments")
    .upsert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSecondaryDepartmentFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("secondary_departments").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function fetchSecondaryStaffMembersFromSupabase(): Promise<SupabaseSecondaryStaffMember[]> {
  if (!supabase) return [];
  
  // Try secondary_staff_members first, then secondary_department_members
  let { data, error } = await supabase
    .from("public_secondary_staff_members")
    .select("*")
    .order("order_index", { ascending: true });

  if (error || !data) {
    data = [];
  }

  return (data || []).map((m) => ({
    ...m,
    image: m.image || m.image_url || "",
    expertise: m.expertise || m.subject || m.designation || "",
  }));
}

export async function saveSecondaryStaffMemberToSupabase(
  member: Partial<SupabaseSecondaryStaffMember>
): Promise<SupabaseSecondaryStaffMember | null> {
  if (!supabase) return null;
  const payload = {
    id: member.id,
    department_id: member.department_id,
    name: member.name || "Staff member",
    designation: member.expertise || "",
    subject: member.expertise || "",
    image: member.image || member.image_url || "",
    order_index: member.display_order || 0,
  };

  const { error } = await supabase.from("secondary_staff_members").upsert([payload]);

  if (error) {
    // Try fallback table secondary_department_members
    const fallbackRes = await supabase.from("secondary_department_members").upsert([payload]);
    if (fallbackRes.error) throw error;
    return { ...payload, expertise: member.expertise || "" } as SupabaseSecondaryStaffMember;
  }

  return { ...payload, expertise: member.expertise || "" } as SupabaseSecondaryStaffMember;
}

export async function deleteSecondaryStaffMemberFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  let { error } = await supabase.from("secondary_staff_members").delete().eq("id", id);
  if (error) {
    await supabase.from("secondary_department_members").delete().eq("id", id);
  }
  return true;
}

// Combined Faculty Loader
export async function fetchFacultyFromSupabase() {
  if (!supabase) return null;
  try {
    const [categories, schoolMembers, departments, secondaryMembers] = await Promise.all([
      fetchSchoolStaffCategoriesFromSupabase(),
      fetchSchoolStaffMembersFromSupabase(),
      fetchSecondaryDepartmentsFromSupabase(),
      fetchSecondaryStaffMembersFromSupabase(),
    ]);

    const schoolStaffCategories = categories.map((cat) => ({
      ...cat,
      members: schoolMembers.filter((m) => m.category_id === cat.id),
    }));

    const secondaryDepartments = departments.map((dept) => ({
      ...dept,
      members: secondaryMembers.filter((m) => m.department_id === dept.id),
    }));

    return { schoolStaffCategories, secondaryDepartments };
  } catch (err) {
    console.warn("Faculty fetch error from Supabase:", err);
    return null;
  }
}

export async function saveFacultyToSupabase(faculty: {
  schoolStaffCategories?: any[];
  secondaryDepartments?: any[];
}) {
  if (!supabase) return;

  if (Array.isArray(faculty.schoolStaffCategories)) {
    for (const cat of faculty.schoolStaffCategories) {
      await saveSchoolStaffCategoryToSupabase({
        id: cat.id,
        title: cat.title,
        description: cat.description || "",
        icon: cat.icon || "Users",
      });
      if (Array.isArray(cat.members)) {
        for (const mem of cat.members) {
          await saveSchoolStaffMemberToSupabase({
            id: mem.id,
            category_id: cat.id,
            name: mem.name,
            designation: mem.designation || "Teacher",
            expertise: mem.expertise || "",
            official_role: mem.officialRole || mem.designation || "",
            image: mem.image || "",
          });
        }
      }
    }
  }

  if (Array.isArray(faculty.secondaryDepartments)) {
    for (const dept of faculty.secondaryDepartments) {
      await saveSecondaryDepartmentToSupabase({
        id: dept.id,
        title: dept.title,
        summary: dept.summary || "",
        icon: dept.icon || "GraduationCap",
      });
      if (Array.isArray(dept.members)) {
        for (const mem of dept.members) {
          await saveSecondaryStaffMemberToSupabase({
            id: mem.id,
            department_id: dept.id,
            name: mem.name,
            expertise: mem.expertise || "",
            image: mem.image || "",
          });
        }
      }
    }
  }
}

// ==========================================
// Site Settings & Content (Tables: site_settings & site_content)
// ==========================================

export async function fetchSiteSettingsFromSupabase(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("site_settings").select("*");
  if (error) {
    console.warn("Supabase site_settings fetch warning:", error.message);
    return {};
  }
  const settings: Record<string, string> = {};
  (data || []).forEach((item) => {
    if (!item.key) return;
    if (item.key === "site" && item.value && typeof item.value === "object") {
      Object.entries(item.value).forEach(([key, value]) => {
        if (typeof value === "string") settings[key] = value;
      });
      return;
    }
    if (typeof item.value === "string") settings[item.key] = item.value;
  });
  return settings;
}

export async function saveSiteSettingToSupabase(
  key: string,
  value: string
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("site_settings")
    .upsert([{ key, value }], { onConflict: "key" });

  if (error) throw error;
  return true;
}

export async function saveSchoolInfoToSupabase(info: Partial<SupabaseSchoolInfo>): Promise<boolean> {
  if (!supabase) return false;
  const value = {
    schoolName: info.school_name || "",
    tagline: info.tagline || "",
    location: info.location || "",
    contact: info.contact || "",
    email: info.email || "",
  };
  const { error } = await supabase.from("site_settings").upsert([{ key: "site", value }]);
  if (error) throw error;
  return true;
}

export async function saveSiteContentToSupabase(content: unknown): Promise<boolean> {
  if (!supabase) return false;
  const source = content as { site?: unknown; home?: unknown };
  const rows = [
    ...(source.site ? [{ key: "site", value: source.site }] : []),
    ...(source.home ? [{ key: "home", value: source.home }] : []),
  ];
  if (rows.length === 0) throw new Error("No site content was provided for Supabase.");
  const { error } = await supabase
    .from("site_content")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
  return true;
}

export async function fetchSiteContentFromSupabase(): Promise<any | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_content")
    .select("key,value");

  if (error || !data?.length) return null;
  return data.reduce((content: Record<string, unknown>, item: { key?: string; value?: unknown }) => {
    if (item.key) content[item.key] = item.value;
    return content;
  }, {});
}

// Master Site Content Loader from Live Tables
export async function fetchFullSiteContentFromSupabase() {
  if (!supabase) return null;

  try {
    const [gallery, notices, faculty, settings, siteContentJson] = await Promise.all([
      fetchGalleryFromSupabase(),
      fetchNoticesFromSupabase(),
      fetchFacultyFromSupabase(),
      fetchSiteSettingsFromSupabase(),
      fetchSiteContentFromSupabase(),
    ]);

    const result: any = {
      ...(siteContentJson || {}),
    };

    if (gallery && gallery.length > 0) {
      result.gallery = gallery.map((g) => ({
        id: g.id,
        src: g.src,
        category: g.category,
        title: g.title,
        desc: g.desc || "",
      }));
    }

    if (notices && notices.length > 0) {
      result.notices = notices.map((n) => ({
        id: n.id,
        title: n.title,
        category: n.category || "notice",
        date: n.date,
        refNo: n.ref_no || "",
        publishedDate: n.published_date || n.date,
        content: {
          salutation: n.salutation || "Dear Parents, Guardians and Students,",
          introduction: n.introduction || n.summary || "",
          body: n.body || n.summary || "",
          bulletPoints: n.bullet_points || [],
          instructionsTitle: n.instructions_title || "",
          instructions: n.instructions || [],
          closing: n.closing || "",
          signatoryName: n.signatory_name || "Administration",
          signatoryTitle: n.signatory_title || "NSVM",
          attachmentUrl: n.attachment_url || n.pdf_url || "",
          attachmentName: n.attachment_name || n.file_name || "",
        },
      }));
    }

    if (faculty && (faculty.schoolStaffCategories?.length || faculty.secondaryDepartments?.length)) {
      result.faculty = {
        schoolStaffCategories: (faculty.schoolStaffCategories || []).map((cat) => ({
          id: cat.id,
          title: cat.title,
          description: cat.description || "",
          icon: cat.icon || "Users",
          members: (cat.members || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            designation: m.designation,
            expertise: m.expertise || "",
            officialRole: m.official_role || m.officialRole || m.designation,
            image: m.image || m.image_url || "",
          })),
        })),
        secondaryDepartments: (faculty.secondaryDepartments || []).map((dept) => ({
          id: dept.id,
          title: dept.title,
          summary: dept.summary || "",
          icon: dept.icon || "GraduationCap",
          members: (dept.members || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            expertise: m.expertise || "",
            image: m.image || m.image_url || "",
          })),
        })),
      };
    }

    if (Object.keys(settings).length > 0) {
      result.site = {
        ...(result.site || {}),
        ...(settings.school_name ? { schoolName: settings.school_name } : {}),
        ...(settings.tagline ? { tagline: settings.tagline } : {}),
        ...(settings.location ? { location: settings.location } : {}),
        ...(settings.contact ? { contact: settings.contact } : {}),
        ...(settings.email ? { email: settings.email } : {}),
      };
    }

    return result;
  } catch (err) {
    console.error("Error building site content from Supabase tables:", err);
    return null;
  }
}

// ==========================================
// Online Applications API (Table: online_applications)
// ==========================================

export async function submitOnlineApplicationToSupabase(
  appData: Partial<SupabaseOnlineApplication>
): Promise<SupabaseOnlineApplication | null> {
  if (!supabase) return null;

  const payload = {
    applicant_name: appData.full_name || (appData as any).fullName || "",
    phone: appData.phone || "",
    email: appData.email || "",
    parent_name: appData.parent_name || (appData as any).parentName || "",
    address: appData.address || "",
    grade_applying: appData.program || appData.grade || (appData as any).grade || "",
    details: {
      guardian_name: appData.guardian_name || (appData as any).guardianName || "",
      guardian_phone: appData.guardian_phone || (appData as any).guardianPhone || "",
      relation: appData.relation || "",
      prev_school: appData.prev_school || (appData as any).prevSchool || "",
      see_gpa: appData.see_gpa || (appData as any).seeGpa || "",
      statement: appData.statement || (appData as any).remarks || "",
      status: "pending",
    },
  };

  const { data, error } = await supabase
    .from("online_applications")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error inserting online application to Supabase:", error.message);
    throw error;
  }
  return data;
}

export async function fetchOnlineApplicationsFromSupabase(): Promise<SupabaseOnlineApplication[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("online_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase fetch online_applications warning:", error.message);
    return [];
  }
  return (data || []).map((item: any) => {
    const details = item.details || {};
    return {
      ...item,
      id: String(item.id),
      full_name: item.applicant_name || "",
      program: item.grade_applying || "",
      grade: item.grade_applying || "",
      guardian_name: details.guardian_name || "",
      guardian_phone: details.guardian_phone || "",
      relation: details.relation || "",
      prev_school: details.prev_school || "",
      see_gpa: details.see_gpa || "",
      statement: details.statement || "",
      status: details.status || "pending",
    };
  });
}

export async function updateOnlineApplicationStatusInSupabase(
  id: string,
  status: SupabaseOnlineApplication["status"]
): Promise<boolean> {
  if (!supabase) return false;
  const { data: current, error: readError } = await supabase
    .from("online_applications")
    .select("details")
    .eq("id", id)
    .single();
  if (readError) throw readError;
  const { error } = await supabase
    .from("online_applications")
    .update({ details: { ...(current?.details || {}), status } })
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function deleteOnlineApplicationFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("online_applications").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ==========================================
// Admin Auth & Authorization (Table: admin_users + Supabase Auth)
// ==========================================

export async function adminLoginWithSupabase(email: string, pass: string) {
  if (!supabase) throw new Error("Supabase credentials not configured.");

  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (authError) {
    throw authError;
  }

  // 2. Authorize against admin_users table strictly
  const user = authData.user;
  if (!user) {
    throw new Error("Authentication failed: No user record returned.");
  }

  let adminRecord: SupabaseAdminUser | null = null;

  // Authorization is bound to the immutable Auth user ID, never an email address.
  const { data: byUserId, error: errUserId } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!errUserId && byUserId) adminRecord = byUserId;

  if (!adminRecord || adminRecord.is_active === false) {
    await supabase.auth.signOut();
    throw new Error("Access denied: this account is not an active Supabase administrator.");
  }

  return authData;
}

export async function startAdminPasswordOtp(email: string, password: string, turnstileToken: string): Promise<void> {
  const response = await fetch("/api/admin/password-challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, turnstileToken }),
  });
  const payload = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "Unable to verify credentials. Please try again later.");
  }
}

export async function requestAdminOtp(email: string, turnstileToken: string): Promise<void> {
  const response = await fetch("/api/admin/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, turnstileToken }),
  });
  if (!response.ok) throw new Error("Unable to request a verification code. Please try again later.");
}

export async function requestAdminPasswordReset(email: string, turnstileToken: string): Promise<void> {
  const response = await fetch("/api/admin/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, turnstileToken }),
  });
  const payload = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(payload.message || "Unable to start password recovery. Please try again later.");
}

export async function verifyAdminOtp(email: string, token: string, turnstileToken: string) {
  if (!supabase) throw new Error("Supabase credentials not configured.");
  const response = await fetch("/api/admin/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, token, turnstileToken }),
  });
  const payload = await response.json().catch(() => ({})) as { message?: string; accessToken?: string; refreshToken?: string };
  if (!response.ok || !payload.accessToken || !payload.refreshToken) {
    throw new Error(payload.message || "Unable to verify the code. Please try again later.");
  }
  const { data, error } = await supabase.auth.setSession({ access_token: payload.accessToken, refresh_token: payload.refreshToken });
  if (error || !data.session || !(await checkSupabaseAdminSession())) {
    await supabase.auth.signOut();
    throw new Error("This verified account is not an active administrator.");
  }
  return data;
}

export async function adminLogoutWithSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function checkSupabaseAdminSession(): Promise<boolean> {
  if (!supabase) return false;
  try {
    let { data: { session } } = await supabase.auth.getSession();

    // If session is initially null, micro-wait in case Supabase is initializing tokens from localStorage
    if (!session) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const retry = await supabase.auth.getSession();
      session = retry.data.session;
    }

    if (!session || !session.user) return false;

    const user = session.user;

    const { data: byUserId, error: userLookupError } = await supabase
      .from("admin_users")
      .select("is_active")
      .eq("user_id", user.id)
      .maybeSingle();
    if (userLookupError) return false;
    if (byUserId) return byUserId.is_active !== false;

    return false;
  } catch (err) {
    console.warn("Check admin session error:", err);
    return false;
  }
}

export async function fetchAdminUsersFromSupabase(): Promise<SupabaseAdminUser[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Fetch admin_users warning:", error.message);
    return [];
  }
  return data || [];
}
