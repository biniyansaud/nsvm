import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Database,
  FileUp,
  GraduationCap,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Table,
  FolderTree,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { NoticeDocument } from "@/components/NoticeViewerModal";
import { getAssetUrl } from "@/lib/assets";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  saveGalleryItemToSupabase,
  saveNoticeToSupabase,
  saveFacultyToSupabase,
  saveSchoolInfoToSupabase,
  saveSiteContentToSupabase,
  fetchFullSiteContentFromSupabase,
  checkSupabaseAdminSession,
  fetchOnlineApplicationsFromSupabase,
  updateOnlineApplicationStatusInSupabase,
  deleteOnlineApplicationFromSupabase,
  deleteGalleryItemFromSupabase,
  deleteNoticeFromSupabase,
  deleteSchoolStaffMemberFromSupabase,
  deleteSecondaryStaffMemberFromSupabase,
  uploadGalleryImage,
  uploadPDFDocument,
  adminLoginWithSupabase,
  startAdminPasswordOtp,
  requestAdminPasswordReset,
  verifyAdminOtp,
  adminLogoutWithSupabase,
  SupabaseOnlineApplication,
} from "@/lib/supabaseApi";
import { SupabaseDiagnostics } from "@/components/SupabaseDiagnostics";
import StaffDataTable from "@/components/StaffDataTable";
import {
  defaultSiteContent,
  GalleryItem,
  mergeContent,
  SchoolStaffCategory,
  SecondaryDepartment,
  SiteContent,
} from "@/lib/siteContent";

type AdminTab = "gallery" | "notices" | "schoolStaff" | "secondaryStaff" | "applications";
type StaffMode = "schoolStaff" | "secondaryStaff";

const tabs: Array<{ id: AdminTab; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "gallery", label: "Gallery", hint: "Photos", icon: Camera },
  { id: "notices", label: "Notices", hint: "Announcements", icon: Bell },
  { id: "schoolStaff", label: "School Staffs", hint: "Faculty page", icon: Users },
  { id: "secondaryStaff", label: "Secondary Staffs", hint: "+2 faculty", icon: GraduationCap },
  { id: "applications", label: "Applications", hint: "Online Forms", icon: Mail },
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-950 shadow-2xs outline-none transition-all placeholder:text-slate-500 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/25 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:bg-slate-50 disabled:text-slate-500";
const labelClass = "text-xs font-bold text-slate-800 tracking-wide";
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/admin/login") {
      window.dispatchEvent(new CustomEvent("admin-unauthorized"));
    }
    const text = await response.text().catch(() => "");
    let message = "";
    try {
      const data = text ? JSON.parse(text) : {};
      message = data.message || "";
    } catch {
      message = text;
    }
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json();
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(value?: string[]) {
  return (value || []).join("\n");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function EmptyEditor({ icon: Icon, title, copy }: { icon: React.ComponentType<{ className?: string }>; title: string; copy: string }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <Icon className="mx-auto h-11 w-11 text-slate-300" />
        <h3 className="mt-4 text-lg font-black text-slate-800">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}

function newNotice(): NoticeDocument {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: Date.now(),
    title: "New notice",
    category: "notice",
    date: today,
    refNo: `RSS/${new Date().getFullYear()}/${Math.floor(Math.random() * 900 + 100)}`,
    publishedDate: today,
    content: {
      salutation: "Dear students, guardians, and staff,",
      introduction: "Write the notice details here.",
      body: "Write the notice details here.",
      bulletPoints: [],
      instructionsTitle: "",
      instructions: [],
      closing: "",
      signatoryName: "Am Raj Bhatt",
      signatoryTitle: "Principal, RSS",
    },
  };
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(() => new URLSearchParams(window.location.search).get("reset_password") === "1");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | undefined>(undefined);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [activeTab, setActiveTab] = useState<AdminTab>("gallery");
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
  const [selectedSchoolCategoryId, setSelectedSchoolCategoryId] = useState<string | null>(null);
  const [selectedSchoolMemberId, setSelectedSchoolMemberId] = useState<string | null>(null);
  const [selectedSecondaryDepartmentId, setSelectedSecondaryDepartmentId] = useState<string | null>(null);
  const [selectedSecondaryMemberId, setSelectedSecondaryMemberId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (passwordRecovery) {
      turnstileWidgetIdRef.current = undefined;
      setTurnstileToken("");
      return;
    }
    if (isAuthed || !turnstileSiteKey || !turnstileContainerRef.current) return;
    const renderWidget = () => {
      if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    };
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]');
    if (existingScript) {
      existingScript.addEventListener("load", renderWidget);
      renderWidget();
      return () => existingScript.removeEventListener("load", renderWidget);
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", renderWidget);
  }, [isAuthed, isLoading, passwordRecovery]);

  const resetTurnstile = () => {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current) window.turnstile?.reset(turnstileWidgetIdRef.current);
  };

  useEffect(() => {
    let alive = true;

    // Listen to Supabase auth state transitions cleanly
    let authListener: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!alive) return;
        if (event === "PASSWORD_RECOVERY") {
          setPasswordRecovery(true);
          setIsAuthed(false);
        } else if (event === "SIGNED_OUT") {
          setIsAuthed(false);
        } else if (session && event === "SIGNED_IN") {
          const isSessionValid = await checkSupabaseAdminSession();
          if (alive && isSessionValid) {
            setIsAuthed(true);
          }
        }
      });
      authListener = subscription;
    }

    async function initAdmin() {
      if (isSupabaseConfigured) {
        if (passwordRecovery) {
          if (alive) setIsLoading(false);
          return;
        }
        // This CMS deliberately requires a fresh OTP challenge on every visit
        // to /admin; persisted browser sessions must never reopen the editor.
        await supabase?.auth.signOut({ scope: "local" });
        const isSessionValid = false;
        if (alive) {
          if (isSessionValid) {
            setIsAuthed(true);
            const sbData = await fetchFullSiteContentFromSupabase();
            if (alive && sbData) setContent(mergeContent(sbData));
          } else {
            setIsAuthed(false);
          }
          setIsLoading(false);
          return;
        }
      }

      try {
        const [sessionResponse, contentResponse] = await Promise.all([
          fetch("/api/admin/session", { credentials: "include" }),
          fetch("/api/content", { credentials: "include", cache: "no-store" }),
        ]);
        if (!alive) return;
        const sessionData = sessionResponse.ok ? await sessionResponse.json().catch(() => ({ ok: false })) : { ok: false };
        setIsAuthed(Boolean(sessionData.ok));
        if (contentResponse.ok) setContent(mergeContent(await contentResponse.json()));
      } catch {
        if (alive) setIsAuthed(false);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    initAdmin();

    const handleUnauthorized = () => {
      if (!isSupabaseConfigured) {
        setIsAuthed(false);
        setStatus("Session expired or unauthorized. Please log in again.");
      }
    };

    window.addEventListener("admin-unauthorized", handleUnauthorized);

    return () => {
      alive = false;
      if (authListener) authListener.unsubscribe();
      window.removeEventListener("admin-unauthorized", handleUnauthorized);
    };
  }, [passwordRecovery]);

  // Automatic 15-minute inactivity logout timer
  useEffect(() => {
    if (!isAuthed) return;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    let lastActivity = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const performInactivityLogout = async () => {
      if (isSupabaseConfigured) {
        await adminLogoutWithSupabase();
      } else {
        try {
          await api("/api/admin/logout", { method: "POST", body: "{}" });
        } catch {
          // ignore endpoint error
        }
      }
      setIsAuthed(false);
      setPassword("");
      setStatus("Logged out automatically due to 15 minutes of inactivity.");
      toast.warning("Logged out automatically due to 15 minutes of inactivity.");
    };

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const timeSinceLastActivity = Date.now() - lastActivity;
      const remainingTime = Math.max(0, INACTIVITY_TIMEOUT_MS - timeSinceLastActivity);

      if (remainingTime <= 0) {
        void performInactivityLogout();
      } else {
        timeoutId = setTimeout(() => {
          void performInactivityLogout();
        }, remainingTime);
      }
    };

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleUserActivity = () => {
      lastActivity = Date.now();
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          resetInactivityTimer();
        }, 1000);
      }
    };

    const handleVisibilityOrFocusChange = () => {
      if (document.visibilityState === "visible" || document.hasFocus()) {
        // Update activity timestamp when window regains focus (e.g. after file dialog selection)
        lastActivity = Date.now();
        resetInactivityTimer();
      }
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityOrFocusChange);
    window.addEventListener("focus", handleVisibilityOrFocusChange);

    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (throttleTimer) clearTimeout(throttleTimer);
      activityEvents.forEach((event) => window.removeEventListener(event, handleUserActivity));
      document.removeEventListener("visibilitychange", handleVisibilityOrFocusChange);
      window.removeEventListener("focus", handleVisibilityOrFocusChange);
    };
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    if (!selectedGalleryId && content.gallery[0]) setSelectedGalleryId(content.gallery[0].id);
    if (!selectedNoticeId && content.notices[0]) setSelectedNoticeId(content.notices[0].id);

    const firstSchoolCategory = content.faculty.schoolStaffCategories[0];
    if (!selectedSchoolCategoryId && firstSchoolCategory) {
      setSelectedSchoolCategoryId(firstSchoolCategory.id);
      setSelectedSchoolMemberId(firstSchoolCategory.members[0]?.id || null);
    }

    const firstSecondaryDepartment = content.faculty.secondaryDepartments[0];
    if (!selectedSecondaryDepartmentId && firstSecondaryDepartment) {
      setSelectedSecondaryDepartmentId(firstSecondaryDepartment.id);
      setSelectedSecondaryMemberId(firstSecondaryDepartment.members[0]?.id || null);
    }
  }, [
    content,
    isAuthed,
    selectedGalleryId,
    selectedNoticeId,
    selectedSchoolCategoryId,
    selectedSecondaryDepartmentId,
  ]);

  const selectedGallery = useMemo(
    () => content.gallery.find((item) => item.id === selectedGalleryId) || null,
    [content.gallery, selectedGalleryId],
  );
  const selectedNotice = useMemo(
    () => content.notices.find((notice) => notice.id === selectedNoticeId) || null,
    [content.notices, selectedNoticeId],
  );

  const selectedSchoolCategory =
    content.faculty.schoolStaffCategories.find((category) => category.id === selectedSchoolCategoryId) || null;
  const selectedSchoolMember =
    selectedSchoolCategory?.members.find((member) => member.id === selectedSchoolMemberId) || null;
  const selectedSecondaryDepartment =
    content.faculty.secondaryDepartments.find((department) => department.id === selectedSecondaryDepartmentId) || null;
  const selectedSecondaryMember =
    selectedSecondaryDepartment?.members.find((member) => member.id === selectedSecondaryMemberId) || null;
  const dashboardMetrics = useMemo(
    () => [
      { label: "Gallery", value: content.gallery.length, note: "Live media entries", icon: Camera },
      { label: "Notices", value: content.notices.length, note: "Announcements", icon: Bell },
      {
        label: "School Staff",
        value: content.faculty.schoolStaffCategories.reduce((total, category) => total + category.members.length, 0),
        note: "Faculty profiles",
        icon: Users,
      },
      {
        label: "+2 Staff",
        value: content.faculty.secondaryDepartments.reduce((total, department) => total + department.members.length, 0),
        note: "Department members",
        icon: GraduationCap,
      },
    ],
    [content],
  );

  const updateContent = (updater: (current: SiteContent) => SiteContent) => {
    setContent((current) => updater(current));
    setStatus("Unsaved changes");
  };

  const uploadFile = async (file: File) => {
    if (isSupabaseConfigured) {
      if (file.type.includes("pdf")) {
        const url = await uploadPDFDocument(file);
        return { url };
      } else {
        const url = await uploadGalleryImage(file);
        return { url };
      }
    }
    const dataUrl = await fileToDataUrl(file);
    return api<{ url: string }>("/api/admin/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, dataUrl }),
    });
  };

  const uploadAndUse = async (file: File, onUploaded: (url: string) => void, message = "Uploading file...") => {
    setIsSaving(true);
    setStatus(message);
    try {
      const upload = await uploadFile(file);
      onUploaded(upload.url);
      setStatus("Uploaded. Publish to make it live.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsSaving(false);
    }
  };

  const addGalleryImage = (file?: File) => {
    const item: GalleryItem = {
      id: makeId("gal"),
      src: "",
      category: "campus",
      title: file ? file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") : "New gallery image",
      desc: "Write a short description for this image.",
    };
    updateContent((current) => ({ ...current, gallery: [item, ...current.gallery] }));
    setSelectedGalleryId(item.id);
    if (file) {
      void uploadAndUse(file, (url) => {
        updateContent((current) => ({
          ...current,
          gallery: current.gallery.map((galleryItem) => (galleryItem.id === item.id ? { ...galleryItem, src: url } : galleryItem)),
        }));
      }, "Uploading gallery image...");
    }
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus("Authenticating...");
    try {
      if (!turnstileSiteKey) throw new Error("Admin security check is not configured. Contact the site owner.");
      if (!turnstileToken) throw new Error("Complete the security check before continuing.");
      if (isSupabaseConfigured) {
        if (!email || (!otpRequested && !password)) {
          throw new Error("Please enter your administrator email and password.");
        }
        if (!otpRequested) {
          await startAdminPasswordOtp(email, password, turnstileToken);
          resetTurnstile();
          setOtpRequested(true);
          setStatus("If this email is an approved administrator account, a verification code has been sent.");
          return;
        }
        if (!otp.trim()) throw new Error("Enter the verification code sent to your email.");
        await verifyAdminOtp(email, otp.trim(), turnstileToken);
        resetTurnstile();
        setIsAuthed(true);
        setStatus("Authenticated via Supabase");
        toast.success("Welcome back! Signed in to Admin Workspace.");
        const sbData = await fetchFullSiteContentFromSupabase();
        if (sbData) setContent(mergeContent(sbData));
        return;
      }

      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      resetTurnstile();
      setContent(mergeContent(await api<SiteContent>("/api/content")));
      setIsAuthed(true);
      setStatus("Logged in");
      toast.success("Signed in to Admin Workspace.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Login failed";
      setStatus(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const requestPasswordReset = async () => {
    setIsSaving(true);
    try {
      if (!email) throw new Error("Enter your administrator email first.");
      if (!turnstileSiteKey || !turnstileToken) throw new Error("Complete the security check before continuing.");
      await requestAdminPasswordReset(email, turnstileToken);
      resetTurnstile();
      setStatus("If this is the approved administrator email, a password-reset link has been sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start password recovery.";
      setStatus(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateForgottenPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (!supabase) throw new Error("Supabase credentials not configured.");
      if (newPassword.length < 12) throw new Error("Use a password with at least 12 characters.");
      if (newPassword !== confirmPassword) throw new Error("The new passwords do not match.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await adminLogoutWithSupabase();
      window.history.replaceState({}, "", "/admin");
      setPasswordRecovery(false);
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Password updated. Sign in with your new password and complete a new security check.");
      toast.success("Password updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update the password.";
      setStatus(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await adminLogoutWithSupabase();
    } else {
      try {
        await api("/api/admin/logout", { method: "POST", body: "{}" });
      } catch {
        // ignore
      }
    }
    setIsAuthed(false);
    setPassword("");
    setLocation("/");
  };

  const publish = async () => {
    setIsSaving(true);
    setStatus("Publishing to Supabase...");
    try {
      if (isSupabaseConfigured) {
        // 1. Sync gallery items to 'gallery' table
        for (const item of content.gallery) {
          if (item.src) {
            await saveGalleryItemToSupabase({
              id: item.id,
              title: item.title,
              desc: item.desc,
              category: item.category || "campus",
              src: item.src,
            });
          }
        }

        // 2. Sync notices to 'notices' table
        for (const notice of content.notices) {
          await saveNoticeToSupabase({
            id: notice.id,
            title: notice.title,
            date: notice.date || new Date().toISOString().slice(0, 10),
            category: (notice.category || "notice") as any,
            summary: notice.content?.introduction || notice.content?.body || notice.title,
            published_date: notice.publishedDate || notice.date,
            ref_no: notice.refNo || "",
            salutation: notice.content?.salutation || "",
            introduction: notice.content?.introduction || "",
            body: notice.content?.body || "",
            bullet_points: notice.content?.bulletPoints || [],
            instructions_title: notice.content?.instructionsTitle || "",
            instructions: notice.content?.instructions || [],
            closing: notice.content?.closing || "",
            signatory_name: notice.content?.signatoryName || "",
            signatory_title: notice.content?.signatoryTitle || "",
            attachment_url: notice.content?.attachmentUrl || "",
            attachment_name: notice.content?.attachmentName || "",
          });
        }

        // 3. Sync faculty categories and members to Supabase DB tables
        if (content.faculty) {
          await saveFacultyToSupabase(content.faculty);
        }

        // 4. Sync site settings and content
        if (content.site) {
          await saveSchoolInfoToSupabase({
            school_name: content.site.schoolName,
            tagline: content.site.tagline,
            location: content.site.location,
            contact: content.site.contact,
            email: content.site.email,
          });
        }
        await saveSiteContentToSupabase(content);

        setStatus("Published directly to Supabase tables!");
        toast.success("Published changes live!");
        return;
      }

      // Local server API save mirror as secondary option (only when Supabase is NOT configured)
      const saved = await api<SiteContent>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      setContent(mergeContent(saved));
      setStatus("Published to local database!");
      toast.success("Published changes live!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Publish failed";
      setStatus(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <main className="admin-page grid min-h-screen place-items-center">
        <div className="admin-loading-card">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          <span>Preparing admin workspace</span>
        </div>
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="admin-login-page relative">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur border border-white/10 shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-white"
          title="Exit to Homepage"
          aria-label="Exit back to Homepage"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="admin-login-shell">
          <section className="admin-login-copy">
            <span className="admin-secure-chip">
              <ShieldCheck className="h-4 w-4" />
              Private school CMS
            </span>
            <h1>New SaraswatiAdmin Workspace</h1>
            <p>
              Manage notices, gallery media, and faculty profiles from one focused control room.
            </p>
            <div className="admin-login-proof">
              <span><Database className="h-4 w-4" /> Supabase-ready storage</span>
              <span><LayoutDashboard className="h-4 w-4" /> Responsive editor</span>
              <span><Save className="h-4 w-4" /> Publish workflow</span>
            </div>
          </section>

          {passwordRecovery ? <form onSubmit={updateForgottenPassword} className="admin-login-card">
            <span className="admin-login-icon">
              <KeyRound className="h-6 w-6 text-teal-700" />
            </span>
            <h2>Set a new password</h2>
            <p>This recovery link is single-use. After changing your password, sign in again with CAPTCHA and email OTP.</p>
            <div className="mt-5 space-y-4">
              <Field label="New password">
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} minLength={12} required autoComplete="new-password" />
              </Field>
              <Field label="Confirm new password">
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} minLength={12} required autoComplete="new-password" />
              </Field>
            </div>
            {status ? <p className="admin-status-note mt-3">{status}</p> : null}
            <button type="submit" disabled={isSaving} className={`${buttonBase} admin-login-button mt-4`}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Save new password
            </button>
          </form> : <form onSubmit={login} className="admin-login-card">
            <span className="admin-login-icon">
              <ShieldCheck className="h-6 w-6 text-teal-700" />
            </span>
            <h2>Admin Authentication</h2>
            <p>Verify your administrator password, then enter the one-time code sent to that email.</p>
            <div className="mt-5 space-y-4">
              <Field label="Admin Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="admin@school.edu.np"
                    required
                    autoFocus
                  />
                </div>
              </Field>

              {!otpRequested ? <Field label="Admin Password">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClass} pl-9`}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </Field> : null}

              {otpRequested ? <Field label="One-time verification code">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    className={`${inputClass} pl-9`}
                    placeholder="Enter code"
                    required
                  />
                </div>
              </Field> : null}
              <div>
                <p className={labelClass}>Security check</p>
                {turnstileSiteKey ? <div ref={turnstileContainerRef} className="mt-2 min-h-[65px]" /> : <p className="mt-2 text-sm text-red-700">CAPTCHA is not configured. Admin sign-in is disabled.</p>}
              </div>
            </div>
            {status ? <p className="admin-status-note mt-3">{status}</p> : null}
            <button
              type="submit"
              disabled={isSaving}
              className={`${buttonBase} admin-login-button mt-4`}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {otpRequested ? "Verify and Sign In" : "Send verification code"}
            </button>
            {!otpRequested ? <button
              type="button"
              disabled={isSaving}
              onClick={() => void requestPasswordReset()}
              className={`${buttonBase} mt-2 w-full border border-teal-700 text-teal-800 hover:bg-teal-50`}
            >
              Forgot password?
            </button> : null}
          </form>}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-black text-white leading-tight truncate">
                NSVM CMS
              </h2>
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-950/80 border border-teal-800/60 px-2 py-0.5 rounded-md mt-0.5">
                Control Room
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Body & Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation Links */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Management Views
            </div>
            <nav className="space-y-1.5" role="tablist" aria-label="Admin Navigation Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                let count = 0;
                if (tab.id === "gallery") count = content.gallery.length;
                if (tab.id === "notices") count = content.notices.length;
                if (tab.id === "schoolStaff")
                  count = content.faculty.schoolStaffCategories.reduce((s, c) => s + c.members.length, 0);
                if (tab.id === "secondaryStaff")
                  count = content.faculty.secondaryDepartments.reduce((s, c) => s + c.members.length, 0);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${tab.label} tab, ${count} items`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setQuery("");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm transition-all text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
                      isActive
                        ? "bg-teal-700 text-white shadow-md shadow-teal-950/40 border border-teal-500/40"
                        : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <div className="min-w-0">
                        <span className="block truncate">{tab.label}</span>
                        <span className={`block text-[11px] font-medium leading-tight ${isActive ? "text-teal-100" : "text-slate-400"}`}>
                          {tab.hint}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                        isActive
                          ? "bg-teal-900/80 text-teal-100 border border-teal-400/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700/60"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Metrics Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Content Overview
            </span>
            <div className="grid grid-cols-2 gap-2">
              {dashboardMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-teal-400 mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold text-slate-300 truncate">{metric.label}</span>
                    </div>
                    <div className="text-base font-black text-white">{metric.value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              System Telemetry
            </span>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                <Database className={`h-3.5 w-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-slate-400'}`} />
                Storage Engine
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                isSupabaseConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {isSupabaseConfigured ? "Supabase Live" : "Local DB"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                Auto-Logout
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                15m Inactivity
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer - Account & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">{email}</span>
              <span className="block text-[10px] text-slate-400 font-semibold">Administrator</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={logout}
              aria-label="Log out of admin session"
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
            <button
              type="button"
              onClick={() => setLocation("/")}
              aria-label="Exit CMS to school homepage"
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
              title="Exit back to Homepage"
            >
              <X className="h-3.5 w-3.5" />
              Exit CMS
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 lg:pl-72 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight tracking-tight flex items-center gap-2">
                {tabs.find((t) => t.id === activeTab)?.label || "Admin Panel"}
              </h1>
              <p className="text-xs font-semibold text-slate-500 hidden sm:block">
                {tabs.find((t) => t.id === activeTab)?.hint} • NSVM Content Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {status ? (
              <span className="text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-bold shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">{status}</span>
              </span>
            ) : null}

            <button
              type="button"
              onClick={publish}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Publish Changes
            </button>
          </div>
        </header>

        {/* Main Section Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <SupabaseDiagnostics />

          {/* Mobile Quick-Tab Switcher Bar */}
          <div className="lg:hidden -mt-1 overflow-x-auto flex items-center gap-2 pb-2 pt-1 border-b border-slate-200/80 no-scrollbar" role="tablist" aria-label="Mobile Navigation Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              let count = 0;
              if (tab.id === "gallery") count = content.gallery.length;
              if (tab.id === "notices") count = content.notices.length;
              if (tab.id === "schoolStaff")
                count = content.faculty.schoolStaffCategories.reduce((s, c) => s + c.members.length, 0);
              if (tab.id === "secondaryStaff")
                count = content.faculty.secondaryDepartments.reduce((s, c) => s + c.members.length, 0);

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${tab.label} tab (${count})`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setQuery("");
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-700 ${
                    isActive
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-teal-700"}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                      isActive ? "bg-teal-900 text-teal-100" : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTab === "gallery" ? (
            <GalleryAdmin
              items={content.gallery}
              query={query}
              selected={selectedGallery}
              onQuery={setQuery}
              onAdd={addGalleryImage}
              onSelect={setSelectedGalleryId}
              onChange={(item) =>
                updateContent((current) => ({
                  ...current,
                  gallery: current.gallery.map((galleryItem) => (galleryItem.id === item.id ? item : galleryItem)),
                }))
              }
              onDelete={async () => {
                if (!selectedGallery) return;
                const idToDelete = selectedGallery.id;
                if (isSupabaseConfigured) {
                  try {
                    await deleteGalleryItemFromSupabase(idToDelete);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Gallery item could not be deleted.";
                    toast.error(message);
                    return;
                  }
                }
                updateContent((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== idToDelete) }));
                setSelectedGalleryId(null);
                toast.success("Gallery item deleted");
              }}
              onUpload={(file) => {
                if (!selectedGallery) return;
                void uploadAndUse(file, (url) => {
                  updateContent((current) => ({
                    ...current,
                    gallery: current.gallery.map((item) => (item.id === selectedGallery.id ? { ...item, src: url } : item)),
                  }));
                }, "Replacing gallery image...");
              }}
            />
          ) : null}

          {activeTab === "notices" ? (
            <NoticesAdmin
              notices={content.notices}
              query={query}
              selected={selectedNotice}
              onQuery={setQuery}
              onSelect={setSelectedNoticeId}
              onAdd={() => {
                const notice = newNotice();
                updateContent((current) => ({ ...current, notices: [notice, ...current.notices] }));
                setSelectedNoticeId(notice.id);
              }}
              onChange={(notice) =>
                updateContent((current) => ({
                  ...current,
                  notices: current.notices.map((item) => (item.id === notice.id ? notice : item)),
                }))
              }
              onDelete={async () => {
                if (!selectedNotice) return;
                const noticeToDelete = selectedNotice.id;
                if (isSupabaseConfigured) {
                  try {
                    await deleteNoticeFromSupabase(noticeToDelete);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Notice could not be deleted.";
                    toast.error(message);
                    return;
                  }
                }
                updateContent((current) => ({ ...current, notices: current.notices.filter((notice) => notice.id !== noticeToDelete) }));
                setSelectedNoticeId(null);
                toast.success("Notice deleted");
              }}
              onUpload={(file) => {
                if (!selectedNotice) return;
                void uploadAndUse(file, (url) => {
                  updateContent((current) => ({
                    ...current,
                    notices: current.notices.map((notice) =>
                      notice.id === selectedNotice.id
                        ? { ...notice, content: { ...notice.content, attachmentUrl: url, attachmentName: file.name } }
                        : notice,
                    ),
                  }));
                }, "Uploading notice file...");
              }}
            />
          ) : null}

          {activeTab === "schoolStaff" ? (
            <FacultyAdmin
              mode="schoolStaff"
              categories={content.faculty.schoolStaffCategories}
              selectedCategoryId={selectedSchoolCategoryId}
              selectedMemberId={selectedSchoolMemberId}
              query={query}
              onQuery={setQuery}
              onSelect={(categoryId, memberId) => {
                setSelectedSchoolCategoryId(categoryId);
                setSelectedSchoolMemberId(memberId);
              }}
              onChange={(categories) =>
                updateContent((current) => ({
                  ...current,
                  faculty: { ...current.faculty, schoolStaffCategories: categories as SchoolStaffCategory[] },
                }))
              }
              onUploadPhotoDirect={(file, categoryId, memberId) => {
                void uploadAndUse(file, (url) => {
                  updateContent((current) => ({
                    ...current,
                    faculty: {
                      ...current.faculty,
                      schoolStaffCategories: current.faculty.schoolStaffCategories.map((category) =>
                        category.id === categoryId
                          ? {
                              ...category,
                              members: category.members.map((member) =>
                                member.id === memberId ? { ...member, image: url } : member,
                              ),
                            }
                          : category,
                      ),
                    },
                  }));
                }, "Uploading staff photo...");
              }}
              onUpload={(file) => {
                if (!selectedSchoolCategory || !selectedSchoolMember) return;
                void uploadAndUse(file, (url) => {
                  updateContent((current) => ({
                    ...current,
                    faculty: {
                      ...current.faculty,
                      schoolStaffCategories: current.faculty.schoolStaffCategories.map((category) =>
                        category.id === selectedSchoolCategory.id
                          ? {
                              ...category,
                              members: category.members.map((member) =>
                                member.id === selectedSchoolMember.id ? { ...member, image: url } : member,
                              ),
                            }
                          : category,
                      ),
                    },
                  }));
                }, "Uploading staff photo...");
              }}
            />
          ) : null}

          {activeTab === "secondaryStaff" ? (
            <FacultyAdmin
              mode="secondaryStaff"
              categories={content.faculty.secondaryDepartments}
              selectedCategoryId={selectedSecondaryDepartmentId}
              selectedMemberId={selectedSecondaryMemberId}
              query={query}
              onQuery={setQuery}
              onSelect={(categoryId, memberId) => {
                setSelectedSecondaryDepartmentId(categoryId);
                setSelectedSecondaryMemberId(memberId);
              }}
              onChange={(categories) =>
                updateContent((current) => ({
                  ...current,
                  faculty: { ...current.faculty, secondaryDepartments: categories as SecondaryDepartment[] },
                }))
              }
              onUploadPhotoDirect={(file, categoryId, memberId) => {
                void uploadAndUse(file, (url) => {
                  updateContent((current) => ({
                    ...current,
                    faculty: {
                      ...current.faculty,
                      secondaryDepartments: current.faculty.secondaryDepartments.map((department) =>
                        department.id === categoryId
                          ? {
                              ...department,
                              members: department.members.map((member) =>
                                member.id === memberId ? { ...member, image: url } : member,
                              ),
                            }
                          : department,
                      ),
                    },
                  }));
                }, "Uploading staff photo...");
              }}
              onUpload={(file) => {
                if (!selectedSecondaryDepartment || !selectedSecondaryMember) return;
                void uploadAndUse(file, (url) => {
                  updateContent((current) => ({
                    ...current,
                    faculty: {
                      ...current.faculty,
                      secondaryDepartments: current.faculty.secondaryDepartments.map((department) =>
                        department.id === selectedSecondaryDepartment.id
                          ? {
                              ...department,
                              members: department.members.map((member) =>
                                member.id === selectedSecondaryMember.id ? { ...member, image: url } : member,
                              ),
                            }
                          : department,
                      ),
                    },
                  }));
                }, "Uploading staff photo...");
              }}
            />
          ) : null}

          {activeTab === "applications" ? <ApplicationsAdmin /> : null}
        </main>
      </div>
    </div>
  );
}

function Toolbar({
  title,
  count,
  query,
  onQuery,
  action,
}: {
  title: string;
  count: number;
  query: string;
  onQuery: (value: string) => void;
  action: React.ReactNode;
}) {
  return (
    <div className="admin-toolbar mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div>
        <h2 className="font-display text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
          {title}
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
            {count}
          </span>
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <label className="relative flex-1 sm:w-64" aria-label={`Search ${title}`}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            className={`${inputClass} pl-8.5 text-xs py-2`}
            placeholder={`Search ${title}...`}
            aria-label={`Search ${title}`}
          />
        </label>
        {action}
      </div>
    </div>
  );
}

function GalleryAdmin({
  items,
  selected,
  query,
  onQuery,
  onAdd,
  onSelect,
  onChange,
  onDelete,
  onUpload,
}: {
  items: GalleryItem[];
  selected: GalleryItem | null;
  query: string;
  onQuery: (value: string) => void;
  onAdd: (file?: File) => void;
  onSelect: (id: string) => void;
  onChange: (item: GalleryItem) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  const filtered = items.filter((item) => `${item.title} ${item.category} ${item.desc}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <Toolbar
        title="Gallery Manager"
        count={items.length}
        query={query}
        onQuery={onQuery}
        action={
          <label className={`${buttonBase} cursor-pointer bg-teal-700 text-white hover:bg-teal-800 transition-all active:scale-95`}>
            <ImagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                onAdd(file);
              }}
            />
          </label>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <div className={`admin-panel p-4 ${selected ? "hidden xl:block" : "block"}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                data-active={selected?.id === item.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all hover:border-teal-400 hover:shadow-xs data-[active=true]:border-teal-600 data-[active=true]:ring-2 data-[active=true]:ring-teal-500/20"
              >
                <div className="aspect-[4/3] bg-slate-100 relative">
                  {item.src ? (
                    <img src={getAssetUrl(item.src)} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-300">
                      <Camera className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <span className="block min-w-0 p-2.5">
                  <span className="block truncate text-xs font-black text-slate-900">{item.title}</span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-teal-700">{item.category}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="admin-panel p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4 xl:hidden pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => onSelect("")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-100 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Gallery List
              </button>
            </div>
            <div className="grid gap-4">
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80">
                {selected.src ? (
                  <img src={getAssetUrl(selected.src)} alt={selected.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300">
                    <Camera className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <label className={`${buttonBase} flex-1 sm:flex-none cursor-pointer border border-teal-300/80 bg-teal-50 text-teal-800 hover:bg-teal-100/80`}>
                  <Upload className="h-4 w-4" />
                  Replace Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = "";
                      if (file) onUpload(file);
                    }}
                  />
                </label>
                <button type="button" onClick={onDelete} className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
              <Field label="Image title">
                <input value={selected.title} onChange={(event) => onChange({ ...selected, title: event.target.value })} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    value={selected.category}
                    onChange={(event) => onChange({ ...selected, category: event.target.value as GalleryItem["category"] })}
                    className={inputClass}
                  >
                    <option value="campus">Campus</option>
                    <option value="learning">Learning</option>
                    <option value="activities">Activities</option>
                    <option value="events">Events</option>
                  </select>
                </Field>
                <Field label="Image URL">
                  <input value={selected.src} onChange={(event) => onChange({ ...selected, src: event.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="Description">
                <textarea value={selected.desc} onChange={(event) => onChange({ ...selected, desc: event.target.value })} className={`${inputClass} min-h-24`} />
              </Field>
            </div>
          </div>
        ) : (
          <EmptyEditor icon={Pencil} title="Select a photo to edit" copy="Choose any gallery image from the grid, or upload a new photo." />
        )}
      </div>
    </>
  );
}

function NoticesAdmin(props: {
  notices: NoticeDocument[];
  selected: NoticeDocument | null;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onChange: (notice: NoticeDocument) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  const filtered = props.notices.filter((notice) =>
    `${notice.title} ${notice.category} ${notice.refNo} ${notice.content.introduction}`.toLowerCase().includes(props.query.toLowerCase()),
  );

  return (
    <>
      <Toolbar
        title="Notice Board"
        count={props.notices.length}
        query={props.query}
        onQuery={props.onQuery}
        action={
          <button type="button" onClick={props.onAdd} className={`${buttonBase} bg-teal-700 text-white hover:bg-teal-800 transition-all active:scale-95`}>
            <Plus className="h-4 w-4" />
            <span>Add Notice</span>
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className={`admin-panel grid xl:max-h-[calc(100vh-220px)] max-h-none gap-2.5 xl:overflow-y-auto overflow-y-visible p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs ${props.selected ? "hidden xl:grid" : "grid"}`}>
          {filtered.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => props.onSelect(notice.id)}
              data-active={props.selected?.id === notice.id}
              className="rounded-xl border border-slate-200/90 p-3.5 text-left transition-all hover:bg-slate-50 hover:border-teal-300 data-[active=true]:border-teal-600 data-[active=true]:bg-teal-50/80 data-[active=true]:ring-2 data-[active=true]:ring-teal-500/20"
            >
              <span className="block text-sm font-black text-slate-900 leading-snug">{notice.title}</span>
              <span className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="uppercase text-teal-700 tracking-wider">{notice.category || "notice"}</span>
                <span>{notice.date}</span>
              </span>
            </button>
          ))}
        </div>
        {props.selected ? (
          <NoticeEditor notice={props.selected} onSelect={props.onSelect} onChange={props.onChange} onDelete={props.onDelete} onUploadAttachment={props.onUpload} />
        ) : (
          <EmptyEditor icon={Bell} title="Select a notice to edit" copy="Open any notice from the list, or create a new notice when the school has an update." />
        )}
      </div>
    </>
  );
}

function NoticeEditor({
  notice,
  onSelect,
  onChange,
  onDelete,
  onUploadAttachment,
}: {
  notice: NoticeDocument;
  onSelect: (id: number) => void;
  onChange: (notice: NoticeDocument) => void;
  onDelete: () => void;
  onUploadAttachment: (file: File) => void;
}) {
  const update = (patch: Partial<NoticeDocument>) => onChange({ ...notice, ...patch });
  const updateContent = (patch: Partial<NoticeDocument["content"]>) => onChange({ ...notice, content: { ...notice.content, ...patch } });

  return (
    <div className="admin-panel p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between gap-3 mb-4 xl:hidden pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => onSelect(0)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notice List
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-950">Notice Details</h2>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-500">Edit text, attachments, and signatory before publishing.</p>
        </div>
        <button type="button" onClick={onDelete} className={`${buttonBase} w-fit border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Notice title">
          <input value={notice.title} onChange={(event) => update({ title: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Notice type">
          <input value={notice.category} onChange={(event) => update({ category: event.target.value })} className={inputClass} placeholder="notice, exam, event..." />
        </Field>
        <Field label="Date">
          <input value={notice.date} onChange={(event) => update({ date: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Published date">
          <input value={notice.publishedDate} onChange={(event) => update({ publishedDate: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Reference no">
          <input value={notice.refNo} onChange={(event) => update({ refNo: event.target.value })} className={inputClass} />
        </Field>
        <Field label="Salutation">
          <input value={notice.content.salutation || ""} onChange={(event) => updateContent({ salutation: event.target.value })} className={inputClass} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Notice body">
          <textarea
            value={notice.content.body || notice.content.introduction}
            onChange={(event) => updateContent({ body: event.target.value, introduction: event.target.value })}
            className={`${inputClass} min-h-48`}
          />
        </Field>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Optional points - one per line">
            <textarea value={arrayToLines(notice.content.bulletPoints)} onChange={(event) => updateContent({ bulletPoints: linesToArray(event.target.value) })} className={`${inputClass} min-h-32`} />
          </Field>
          <Field label="Optional instructions - one per line">
            <textarea value={arrayToLines(notice.content.instructions)} onChange={(event) => updateContent({ instructions: linesToArray(event.target.value) })} className={`${inputClass} min-h-32`} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Instructions title">
            <input value={notice.content.instructionsTitle || ""} onChange={(event) => updateContent({ instructionsTitle: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Closing line">
            <input value={notice.content.closing || ""} onChange={(event) => updateContent({ closing: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Signatory name">
            <input value={notice.content.signatoryName || ""} onChange={(event) => updateContent({ signatoryName: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Signatory title">
            <input value={notice.content.signatoryTitle || ""} onChange={(event) => updateContent({ signatoryTitle: event.target.value })} className={inputClass} />
          </Field>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={labelClass}>Optional notice file</p>
              {notice.content.attachmentUrl ? (
                <a href={notice.content.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-bold text-teal-700 underline-offset-4 hover:underline">
                  {notice.content.attachmentName || notice.content.attachmentUrl}
                </a>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-600">No file attached.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 mb-1">
              <label className={`${buttonBase} cursor-pointer bg-teal-700 text-white hover:bg-teal-800 transition-all active:scale-95`}>
                <FileUp className="h-4 w-4" />
                Upload File
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (file) onUploadAttachment(file);
                  }}
                />
              </label>
              {notice.content.attachmentUrl ? (
                <button type="button" onClick={() => updateContent({ attachmentUrl: "", attachmentName: "" })} className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70 transition-all active:scale-95`}>
                  <Trash2 className="h-4 w-4" />
                  Remove File
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type EditableCategory = SchoolStaffCategory | SecondaryDepartment;

function FacultyAdmin({
  mode,
  categories,
  selectedCategoryId,
  selectedMemberId,
  query,
  onQuery,
  onSelect,
  onChange,
  onUpload,
  onUploadPhotoDirect,
}: {
  mode: StaffMode;
  categories: EditableCategory[];
  selectedCategoryId: string | null;
  selectedMemberId: string | null;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (categoryId: string, memberId: string | null) => void;
  onChange: (categories: EditableCategory[]) => void;
  onUpload: (file: File) => void;
  onUploadPhotoDirect?: (file: File, categoryId: string, memberId: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || null;
  const selectedMember = selectedCategory?.members.find((member) => member.id === selectedMemberId) || null;
  const categoryLabel = mode === "schoolStaff" ? "Category" : "Department";
  const memberLabel = mode === "schoolStaff" ? "Staff Member" : "Faculty Member";

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      members: category.members.filter((member) =>
        `${category.title} ${"description" in category ? category.description : category.summary} ${member.name} ${"designation" in member ? member.designation : ""} ${member.expertise || ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((category) => !query || category.members.length || category.title.toLowerCase().includes(query.toLowerCase()));

  const replaceCategory = (category: EditableCategory) => onChange(categories.map((item) => (item.id === category.id ? category : item)));
  const removeCategory = (categoryId: string) => {
    onChange(categories.filter((category) => category.id !== categoryId));
    onSelect("", null);
  };
  const replaceMember = (member: EditableCategory["members"][number]) => {
    if (!selectedCategory) return;
    replaceCategory({
      ...selectedCategory,
      members: selectedCategory.members.map((item) => (item.id === member.id ? member : item)),
    } as EditableCategory);
  };

  const addCategory = () => {
    const category =
      mode === "schoolStaff"
        ? ({
            id: makeId("staff-category"),
            title: "New Staff Category",
            description: "Write a short description for this staff group.",
            icon: "Users",
            members: [],
          } satisfies SchoolStaffCategory)
        : ({
            id: makeId("department"),
            title: "New Department",
            summary: "Write a short summary for this department.",
            icon: "GraduationCap",
            members: [],
          } satisfies SecondaryDepartment);
    onChange([category, ...categories]);
    onSelect(category.id, null);
  };

  const addMember = () => {
    if (!selectedCategory) return;
    const member =
      mode === "schoolStaff"
        ? {
            id: makeId("staff"),
            name: "New Staff Member",
            designation: "Teacher",
            expertise: "",
            officialRole: "Teacher",
            image: "",
          }
        : {
            id: makeId("faculty"),
            name: "New Faculty Member",
            expertise: "Subject / qualification",
            image: "",
          };
    replaceCategory({ ...selectedCategory, members: [member, ...selectedCategory.members] } as EditableCategory);
    onSelect(selectedCategory.id, member.id);
  };

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="font-display text-2xl font-black text-slate-950">
            {mode === "schoolStaff" ? "School Staff Directory" : "Secondary Faculty Directory"}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            {categories.reduce((sum, category) => sum + category.members.length, 0)} total personnel records
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-white text-teal-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Interactive Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "tree"
                ? "bg-white text-teal-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Category Tree View</span>
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <StaffDataTable
          mode={mode}
          categories={categories}
          onChange={onChange}
          onUploadPhoto={onUploadPhotoDirect}
          onAddCategory={addCategory}
        />
      ) : (
        <>
          <Toolbar
            title={mode === "schoolStaff" ? "School Staffs Group Editor" : "Secondary Staffs Group Editor"}
            count={categories.reduce((sum, category) => sum + category.members.length, 0)}
            query={query}
            onQuery={onQuery}
            action={
              <button type="button" onClick={addCategory} className={`${buttonBase} bg-teal-700 text-white hover:bg-teal-800`}>
                <Plus className="h-4 w-4" />
                Add {categoryLabel}
              </button>
            }
          />
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className={`admin-panel xl:max-h-[calc(100vh-220px)] max-h-none xl:overflow-y-auto overflow-y-visible p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs ${selectedMemberId || selectedCategoryId ? "hidden xl:block" : "block"}`}>
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              <div key={category.id} className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3">
                <button
                  type="button"
                  onClick={() => onSelect(category.id, null)}
                  data-active={selectedCategoryId === category.id && !selectedMemberId}
                  className="flex w-full items-start justify-between gap-3 rounded-lg p-2 text-left transition hover:bg-white data-[active=true]:bg-teal-50 data-[active=true]:ring-2 data-[active=true]:ring-teal-500/20"
                >
                  <span>
                    <span className="block text-sm font-black text-slate-900">{category.title}</span>
                    <span className="text-xs font-semibold text-slate-500">{category.members.length} members</span>
                  </span>
                  <Pencil className="h-4 w-4 text-slate-400" />
                </button>
                <div className="mt-2 grid gap-2">
                  {category.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => onSelect(category.id, member.id)}
                      data-active={selectedMemberId === member.id}
                      className="grid grid-cols-[44px_1fr] gap-3 rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-teal-300 data-[active=true]:border-teal-500 data-[active=true]:bg-teal-50/80 data-[active=true]:ring-2 data-[active=true]:ring-teal-500/20"
                    >
                      <div className="h-11 w-11 overflow-hidden rounded-md bg-slate-100">
                        {member.image ? <img src={getAssetUrl(member.image)} alt="" className="h-full w-full object-cover object-top" /> : null}
                      </div>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black text-slate-900">{member.name}</span>
                        <span className="block truncate text-[11px] font-semibold text-slate-500">
                          {"designation" in member ? member.designation : member.expertise}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedMember && selectedCategory ? (
          <div className="admin-panel p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4 xl:hidden pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => onSelect("", null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-100 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Faculty List
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="w-full lg:w-72">
                <div className="aspect-[4/3.35] overflow-hidden rounded-lg bg-slate-100">
                  {selectedMember.image ? (
                    <img src={getAssetUrl(selectedMember.image)} alt={selectedMember.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-300">
                      <Users className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <label className={`${buttonBase} mt-3 w-full cursor-pointer border border-dashed border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100/70 transition-all active:scale-95`}>
                  <Upload className="h-4 w-4" />
                  Replace Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = "";
                      if (file) onUpload(file);
                    }}
                  />
                </label>
              </div>
              <div className="grid flex-1 gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={labelClass}>{memberLabel}</p>
                    <h3 className="font-display text-2xl font-black text-slate-950">{selectedMember.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = selectedMember.id;
                      if (isSupabaseConfigured) {
                        if (mode === "schoolStaff") {
                          void deleteSchoolStaffMemberFromSupabase(idToDelete).catch((err) =>
                            console.warn("Delete school staff error:", err)
                          );
                        } else {
                          void deleteSecondaryStaffMemberFromSupabase(idToDelete).catch((err) =>
                            console.warn("Delete secondary staff error:", err)
                          );
                        }
                      }
                      replaceCategory({
                        ...selectedCategory,
                        members: selectedCategory.members.filter((member) => member.id !== idToDelete),
                      } as EditableCategory);
                      onSelect(selectedCategory.id, null);
                      toast.success("Faculty member removed");
                    }}
                    className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70 transition-all active:scale-95`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Member
                  </button>
                </div>
                <Field label="Name">
                  <input value={selectedMember.name} onChange={(event) => replaceMember({ ...selectedMember, name: event.target.value })} className={inputClass} />
                </Field>
                {"designation" in selectedMember ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Designation">
                      <input value={selectedMember.designation} onChange={(event) => replaceMember({ ...selectedMember, designation: event.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Expertise">
                      <input value={selectedMember.expertise || ""} onChange={(event) => replaceMember({ ...selectedMember, expertise: event.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Official role">
                      <input value={selectedMember.officialRole} onChange={(event) => replaceMember({ ...selectedMember, officialRole: event.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Photo URL">
                      <input value={selectedMember.image} onChange={(event) => replaceMember({ ...selectedMember, image: event.target.value })} className={inputClass} />
                    </Field>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Expertise / Qualification">
                      <input value={selectedMember.expertise} onChange={(event) => replaceMember({ ...selectedMember, expertise: event.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Photo URL">
                      <input value={selectedMember.image} onChange={(event) => replaceMember({ ...selectedMember, image: event.target.value })} className={inputClass} />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : selectedCategory ? (
          <div className="admin-panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={labelClass}>{categoryLabel}</p>
                <h3 className="font-display text-2xl font-black text-slate-950">{selectedCategory.title}</h3>
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5 sm:mt-0">
                <button type="button" onClick={addMember} className={`${buttonBase} bg-teal-700 text-white hover:bg-teal-800 transition-all active:scale-95 shadow-sm`}>
                  <Plus className="h-4 w-4" />
                  Add {memberLabel}
                </button>
                <button type="button" onClick={() => removeCategory(selectedCategory.id)} className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70 transition-all active:scale-95 shadow-sm`}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <Field label={`${categoryLabel} title`}>
                <input value={selectedCategory.title} onChange={(event) => replaceCategory({ ...selectedCategory, title: event.target.value } as EditableCategory)} className={inputClass} />
              </Field>
              {"description" in selectedCategory ? (
                <Field label="Description">
                  <textarea value={selectedCategory.description} onChange={(event) => replaceCategory({ ...selectedCategory, description: event.target.value })} className={`${inputClass} min-h-28`} />
                </Field>
              ) : (
                <Field label="Summary">
                  <textarea value={selectedCategory.summary} onChange={(event) => replaceCategory({ ...selectedCategory, summary: event.target.value })} className={`${inputClass} min-h-28`} />
                </Field>
              )}
              <Field label="Icon name">
                <input value={selectedCategory.icon} onChange={(event) => replaceCategory({ ...selectedCategory, icon: event.target.value } as EditableCategory)} className={inputClass} />
              </Field>
            </div>
          </div>
        ) : (
          <EmptyEditor icon={Users} title={`Select a ${categoryLabel.toLowerCase()} or staff member`} copy="Choose a group from the left, then edit the group text or pick a person to edit all their details." />
        )}
      </div>
        </>
      )}
    </>
  );
}

function ApplicationsAdmin() {
  const [applications, setApplications] = useState<SupabaseOnlineApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<SupabaseOnlineApplication | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await fetchOnlineApplicationsFromSupabase();
      setApplications(data);
      if (data.length > 0 && !selectedApp) setSelectedApp(data[0]);
    } catch {
      toast.error("Failed to load applications from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleStatusChange = async (id: string, status: SupabaseOnlineApplication["status"]) => {
    try {
      await updateOnlineApplicationStatusInSupabase(id, status);
      toast.success(`Application status updated to ${status}`);
      loadApplications();
    } catch {
      toast.error("Failed to update application status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this online application record?")) return;
    try {
      await deleteOnlineApplicationFromSupabase(id);
      toast.success("Application deleted");
      setSelectedApp(null);
      loadApplications();
    } catch {
      toast.error("Failed to delete application");
    }
  };

  const filtered = applications.filter((app) =>
    `${app.full_name} ${app.phone} ${app.email || ""} ${app.program || ""} ${app.parent_name || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <>
      <Toolbar
        title="Submitted Online Applications"
        count={applications.length}
        query={query}
        onQuery={setQuery}
        action={
          <button type="button" onClick={loadApplications} className={`${buttonBase} bg-teal-700 text-white hover:bg-teal-800`}>
            <RefreshCw className="h-4 w-4" />
            Refresh List
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className={`admin-panel grid xl:max-h-[calc(100vh-220px)] max-h-none gap-2.5 xl:overflow-y-auto overflow-y-visible p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs ${selectedApp ? "hidden xl:grid" : "grid"}`}>
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
              Loading submissions from Supabase...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">No applications found.</div>
          ) : (
            filtered.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApp(app)}
                data-active={selectedApp?.id === app.id}
                className="rounded-xl border border-slate-200/90 p-3.5 text-left transition-all hover:bg-slate-50 hover:border-teal-300 data-[active=true]:border-teal-600 data-[active=true]:bg-teal-50/80 data-[active=true]:ring-2 data-[active=true]:ring-teal-500/20"
              >
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-black text-slate-900">{app.full_name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                    app.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-900 border-red-300' :
                    app.status === 'reviewed' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-amber-100 text-amber-950 border-amber-300'
                  }`}>
                    {app.status || 'pending'}
                  </span>
                </div>
                <span className="mt-1 block text-xs font-bold text-slate-700">
                  {app.program || app.grade || 'General Admission'} • {app.phone}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-slate-600">
                  Submitted: {app.created_at?.slice(0, 10) || app.submitted_at?.slice(0, 10) || 'Recently'}
                </span>
              </button>
            ))
          )}
        </div>

        {selectedApp ? (
          <div className="admin-panel p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4 xl:hidden pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-100 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Applications List
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-slate-950">{selectedApp.full_name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Program: <span className="font-bold text-teal-800">{selectedApp.program || selectedApp.grade || 'General Admission'}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                  aria-label={`Approve application for ${selectedApp.full_name}`}
                  className={`${buttonBase} bg-emerald-700 text-white hover:bg-emerald-800`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id, 'reviewed')}
                  aria-label={`Mark application reviewed for ${selectedApp.full_name}`}
                  className={`${buttonBase} bg-blue-700 text-white hover:bg-blue-800`}
                >
                  Mark Reviewed
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                  aria-label={`Reject application for ${selectedApp.full_name}`}
                  className={`${buttonBase} border border-red-300 bg-red-50 text-red-800 hover:bg-red-100`}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedApp.id)}
                  className={`${buttonBase} border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200`}
                  title="Delete application record"
                  aria-label={`Delete application record for ${selectedApp.full_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className={labelClass}>Phone Number</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedApp.phone}</p>
              </div>
              <div>
                <span className={labelClass}>Email Address</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedApp.email || 'N/A'}</p>
              </div>
              <div>
                <span className={labelClass}>Parent / Guardian Name</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedApp.parent_name || selectedApp.guardian_name || 'N/A'}</p>
              </div>
              <div>
                <span className={labelClass}>Guardian Contact</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedApp.guardian_phone || 'N/A'} ({selectedApp.relation || 'Parent'})</p>
              </div>
              <div>
                <span className={labelClass}>Address</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedApp.address || 'N/A'}</p>
              </div>
              <div>
                <span className={labelClass}>Previous School & SEE GPA</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedApp.prev_school || 'N/A'} {selectedApp.see_gpa ? `(GPA: ${selectedApp.see_gpa})` : ''}</p>
              </div>
            </div>

            {selectedApp.statement || selectedApp.remarks ? (
              <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200/80">
                <span className={labelClass}>Applicant Statement / Remarks</span>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{selectedApp.statement || selectedApp.remarks}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyEditor
            icon={Mail}
            title="Select an application to view details"
            copy="Choose an online application submission from the left panel to review applicant details, change status, or manage enrollment."
          />
        )}
      </div>
    </>
  );
}
