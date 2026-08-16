import express from "express";
import compression from "compression";
import { createServer } from "http";
import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const resolvedFilename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : "");
const resolvedDirname = typeof import.meta !== "undefined" && import.meta.url
  ? path.dirname(resolvedFilename)
  : (typeof __dirname !== "undefined" ? __dirname : process.cwd());
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

const contentDir = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.resolve(process.cwd(), "data");
const uploadsDir = path.join(contentDir, "uploads");
const contentFile = path.join(contentDir, "content.json");
const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || "";
const otpAdminEmail = (process.env.ADMIN_OTP_EMAIL || "").toLowerCase().trim();
const adminSecret = process.env.ADMIN_SESSION_SECRET || "radiant-local-session";
const adminCookie = "radiant_admin";
const databaseProvider = (process.env.DATABASE_PROVIDER || "file").toLowerCase();
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseContentTable = process.env.SUPABASE_CONTENT_TABLE || "site_content";
const supabaseContentId = process.env.SUPABASE_CONTENT_ID || "radiant";
const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
const appUrl = process.env.APP_URL?.replace(/\/+$/, "");
const resendApiKey = process.env.RESEND_API_KEY;
const otpFromEmail = process.env.OTP_FROM_EMAIL || "onboarding@resend.dev";

async function loadSeedContent() {
  const candidates = [
    path.resolve(process.cwd(), "data", "content.json"),
    path.resolve(resolvedDirname, "..", "data", "content.json"),
    path.resolve(resolvedDirname, "data", "content.json"),
  ];
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      return JSON.parse(raw);
    } catch {
      // try next candidate
    }
  }
  return {
    site: {
      schoolName: "New Saraswati Vidya Mandir Secondary School",
      tagline: "Quality | Confidence | Character",
      location: "Bheemdatt Municipality-18, Mahendranagar",
      contact: "099-525169",
      email: "info@nsvm.edu.np",
      admissionCta: "Apply Now",
    },
    home: {
      heroTitle: "A disciplined school community for confident learners.",
      heroSubtitle:
        "New Saraswati Vidya Mandir combines academic focus, practical exposure, and student care in Mahendranagar.",
      highlights: [],
    },
    gallery: [],
    notices: [],
    faculty: { schoolStaffCategories: [], secondaryDepartments: [] },
    updatedAt: new Date().toISOString(),
  };
}

let seedContentCache: unknown = null;
async function getSeedContent() {
  if (!seedContentCache) seedContentCache = await loadSeedContent();
  return seedContentCache;
}

function signSession(value: string) {
  const signature = crypto.createHmac("sha256", adminSecret).update(value).digest("hex");
  return `${value}.${signature}`;
}

function verifySession(value = "") {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature) return false;
  try {
    const expected = crypto.createHmac("sha256", adminSecret).update(payload).digest("hex");
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

const failedLoginAttempts = new Map<string, { count: number; lockUntil: number }>();
const otpRequestWindows = new Map<string, number[]>();

function hashAuditValue(value: string) {
  return crypto.createHmac("sha256", adminSecret).update(value).digest("hex").slice(0, 16);
}

/** Turnstile tokens are single-use and must always be verified server-side. */
async function verifyTurnstileTokenResult(token: unknown, ip: string): Promise<{ success?: boolean; action?: string; hostname?: string }> {
  if (!turnstileSecretKey || typeof token !== "string" || !token.trim() || token.length > 2048) return {};
  try {
    const body = new URLSearchParams({ secret: turnstileSecretKey, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) return {};
    return await response.json() as { success?: boolean; action?: string; hostname?: string };
  } catch (error) {
    console.error("Turnstile verification failed", { error: error instanceof Error ? error.message : "unknown" });
    return {};
  }
}

async function verifyTurnstileToken(token: unknown, ip: string): Promise<boolean> {
  const result = await verifyTurnstileTokenResult(token, ip);
  return result.success === true;
}

function allowOtpRequest(ip: string, email: string): boolean {
  const now = Date.now();
  const keys = [`ip:${hashAuditValue(ip)}`, `email:${hashAuditValue(email)}`];
  const limits = [5, 3];
  return keys.every((key, index) => {
    const attempts = (otpRequestWindows.get(key) || []).filter((timestamp) => now - timestamp < 15 * 60 * 1000);
    attempts.push(now);
    otpRequestWindows.set(key, attempts);
    return attempts.length <= limits[index];
  });
}

function isRateLimited(key: string): boolean {
  const record = failedLoginAttempts.get(key);
  if (!record) return false;
  if (Date.now() > record.lockUntil) {
    failedLoginAttempts.delete(key);
    return false;
  }
  return record.count >= 5;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = failedLoginAttempts.get(key) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // 15 minute lock
  } else {
    record.lockUntil = now + 30 * 1000; // 30 second delay
  }
  failedLoginAttempts.set(key, record);
}

function clearAttempts(key: string) {
  failedLoginAttempts.delete(key);
}

function safeComparePassword(input: string, target: string): boolean {
  if (typeof input !== "string" || typeof target !== "string" || !input || !target) return false;
  try {
    const inputHash = crypto.createHash("sha256").update(input).digest();
    const targetHash = crypto.createHash("sha256").update(target).digest();
    return crypto.timingSafeEqual(inputHash, targetHash);
  } catch {
    return false;
  }
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      }),
  );
}

async function ensureContentStore() {
  await fs.mkdir(uploadsDir, { recursive: true });
  try {
    await fs.access(contentFile);
  } catch {
    await fs.writeFile(contentFile, JSON.stringify(await getSeedContent(), null, 2), "utf8");
  }
}

function useSupabaseStore() {
  return databaseProvider === "supabase" && Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase storage is selected but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }
  return { url: supabaseUrl, key: supabaseServiceRoleKey };
}

async function supabaseRequest(pathname: string, init: RequestInit = {}) {
  const { url, key } = requireSupabaseConfig();
  const response = await fetch(`${url}${pathname}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase request failed (${response.status}): ${body || response.statusText}`);
  }

  return response;
}

async function verifySupabaseAccessToken(accessToken: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error("Supabase server configuration is missing.");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseServiceRoleKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return await response.json() as { id?: string; email?: string };
}

function getBearerToken(req: express.Request) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function hashOtp(code: string) {
  return crypto.createHmac("sha256", adminSecret).update(code).digest("hex");
}

async function getActiveAdmin(userId: string) {
  const response = await supabaseRequest(
    `/rest/v1/admin_users?select=user_id,email,role,is_active&user_id=eq.${encodeURIComponent(userId)}&is_active=is.true&role=eq.admin&limit=1`,
  );
  const rows = await response.json() as Array<{ user_id?: string; email?: string; role?: string; is_active?: boolean }>;
  return rows[0] || null;
}

async function sendAdminOtp(email: string, code: string) {
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: otpFromEmail,
      to: [email],
      subject: "Your New Saraswati administrator verification code",
      text: `Your administrator verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error("OTP email delivery failed.");
}

async function readFileContent() {
  // Vercel's filesystem is read-only. Use bundled seed content for reads until
  // persistent Supabase storage is configured.
  if (isVercel) return getSeedContent();
  await ensureContentStore();
  const raw = await fs.readFile(contentFile, "utf8");
  return JSON.parse(raw);
}

async function writeFileContent(content: unknown) {
  if (isVercel) {
    throw new Error("Persistent content storage is not configured. Set DATABASE_PROVIDER=supabase and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }
  await ensureContentStore();
  const payload = {
    ...(content as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(contentFile, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

async function readSupabaseContent() {
  const query = `/rest/v1/${supabaseContentTable}?id=eq.${encodeURIComponent(supabaseContentId)}&select=content`;
  const response = await supabaseRequest(query);
  const rows = (await response.json()) as Array<{ content?: unknown }>;
  if (rows[0]?.content) return rows[0].content;
  return writeSupabaseContent(await getSeedContent());
}

async function writeSupabaseContent(content: unknown) {
  const payload = {
    ...(content as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
  };
  await supabaseRequest(`/rest/v1/${supabaseContentTable}?on_conflict=id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: supabaseContentId,
      content: payload,
      updated_at: new Date().toISOString(),
    }),
  });
  return payload;
}

async function readContent() {
  return useSupabaseStore() ? readSupabaseContent() : readFileContent();
}

async function writeContent(content: unknown) {
  return useSupabaseStore() ? writeSupabaseContent(content) : writeFileContent(content);
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  if (verifySession(cookies[adminCookie])) return next();
  res.status(401).json({ message: "Admin login required" });
}

function safeUploadName(name: string) {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  return `${base || "upload"}-${crypto.randomBytes(4).toString("hex")}${ext}`;
}

function getLocalNetworkAddresses() {
  const addresses = new Set<string>();

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.add(entry.address);
      }
    }
  }

  return Array.from(addresses);
}

export async function createApp() {
  const app = express();
  if (isProduction) app.set("trust proxy", 1);

  // Disable Express identification header
  app.disable("x-powered-by");

  // HTTP Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    // Vite injects an inline React-refresh bootstrap in development. Keep the
    // production policy strict, but allow that dev-only bootstrap to run so
    // the client can mount instead of leaving an empty #root element.
    const scriptPolicy = isProduction ? "'self'" : "'self' 'unsafe-inline'";
    res.setHeader("Content-Security-Policy", `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src ${scriptPolicy}; connect-src 'self' ws: wss: https://*.supabase.co; font-src 'self' data: https:; frame-src 'self' https://www.google.com https://www.youtube-nocookie.com`);
    if (isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Enable Gzip/Deflate HTTP response compression in production
  if (isProduction) {
    app.use(compression());
  }
  app.use(express.json({ limit: "10mb" }));
  // Vercel's filesystem is read-only and ephemeral. Persistent deployments use
  // Supabase for content and storage; local/file mode keeps the existing behavior.
  if (!useSupabaseStore()) await ensureContentStore();

  app.use(
    "/uploads",
    express.static(uploadsDir, {
      maxAge: "30d",
      immutable: true,
    }),
  );
  if (!isProduction) {
    app.use(
      "/manus-storage",
      express.static(path.resolve(process.cwd(), "client", "public", "manus-storage"), {
        maxAge: "7d",
      }),
    );
  }

  app.get("/api/content", async (req, res) => {
    try {
      const data = await readContent();
      const jsonStr = JSON.stringify(data);
      const etag = `W/"${crypto.createHash("md5").update(jsonStr).digest("hex")}"`;

      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }

      res.set({
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10, stale-while-revalidate=120",
        ETag: etag,
      });
      res.send(jsonStr);
    } catch (error) {
      console.error("Content API error:", error);
      res.status(503).json({ message: "Content storage is not configured." });
    }
  });

  // Lazy GoogleGenAI client initialization for school assistant
  let aiClient: GoogleGenAI | null = null;
  function getGenAIClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!aiClient) {
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI client:", err);
        return null;
      }
    }
    return aiClient;
  }

  const SYSTEM_INSTRUCTION = `You are "Saraswati AI", the advanced and friendly academic assistant for New Saraswati Vidya Mandir Secondary School (NSVM) located in Bheemdatt Municipality-18, Mahendranagar, Kanchanpur, Sudurpashchim Province, Nepal.
Your goal is to assist students, parents, guardians, and visitors with accurate information about the school, admissions, academics, facilities, and school life.

Key School Details:
- Name: New Saraswati Vidya Mandir Secondary School (NSVM)
- Established: 2060 B.S. (2000 A.D.) by dedicated and experienced academicians.
- Motto: Quality | Confidence | Character
- Campus Population: Serves about 1300 students.
- Levels & Streams:
  * Montessori & Pre-Primary Level (Caring, play-based growth)
  * Primary Level (Grades 1 to 5: foundational literacy, math, social habits)
  * Lower Secondary Level (Grades 6 to 8: project-based learning, integrated science & tech)
  * Secondary Level (Grades 9 and 10: SEE board prep, practical science & computer labs, career counseling)
  * Higher Secondary Level (+2) (Grades 11 and 12: National Examinations Board - NEB, offering Management and Science streams)
- Infrastructure & Facilities:
  * Well-equipped Computer Lab with modern systems & internet
  * Practical Science Labs (Physics, Chemistry, Biology)
  * Interactive Smart Classrooms with multimedia projectors
  * Library with thousands of reference books, text books, and fiction
  * Extracurriculars: Sports (Basketball, Table Tennis, Volleyball, Athletics), Music, Dance, and Cultural programs
  * Hygienic Cafeteria with fresh meals
  * Transportation: School bus service covering Mahendranagar
- Key Leadership:
  * Principal: Am Raj Bhatt (A highly respected educational leader focused on discipline, safe campus, and active parent-teacher collaboration)
- Admissions 2082 B.S.:
  * Admissions are currently open!
  * Interested parents can apply online through the school website's /apply page, or visit the school administration physically.
  * An entrance test is mandatory for new enrollments in Grades 1 to 9 and Grades XI–XII.
  * Scholarships are available for deserving, underprivileged, disabled, and exceptionally high-achieving students.
- Contact Information:
  * Phone: 099-525169
  * Email: info@nsvm.edu.np (or physical administration)
  * Location: Bheemdatt Municipality-18, Mahendranagar, Kanchanpur

Interaction Guidelines:
- Respond in a warm, welcoming, polite, and encouraging tone.
- Be highly supportive of prospective parents interested in enrolling their children.
- You can converse in English, Nepali, or a blend of both (Romanized Nepali / Hinglish) based on what the user uses.
- Keep responses relatively concise and easy to read. Use bullet points for structured details.
- Avoid technical jargon. Frame the school as a disciplined, nurturing community.
- If a query is unrelated to the school or general education, politely redirect the conversation back to New Saraswati Vidya Mandir Secondary School.`;

  // Intelligent local fallback responder for Saraswati AI when Gemini is unavailable
  function getFallbackResponse(message: string): string {
    const query = message.toLowerCase().trim();
    
    // Greetings
    if (/\b(hello|hi|hey|namaste|greetings|morning|afternoon|evening|hello\s+there|hola)\b/.test(query)) {
      return `Namaste & Warm Greetings! 🙏 Welcome to Saraswati AI, the digital assistant for **New Saraswati Vidya Mandir Secondary School (NSVM)**. 

I'm here to help you with information regarding:
• 🎓 **Admissions & Scholarships 2082 B.S.**
• 📚 **Academic Programs (Montessori to Grade 12 - Science & Management)**
• 🏫 **School Facilities & Infrastructure (Labs, Library, Smart Classrooms)**
• 📞 **Contact Details & Location in Mahendranagar**
• 🧑‍💼 **Leadership & Faculty Details**

How can I help you or your child today?`;
    }
    
    // Admissions / Enrollment / Apply / Fee / Cost / Price
    if (/admission|enroll|apply|join|entrance|exam|test|scholarship|discount|fee|cost|pay/i.test(query)) {
      return `🎓 **Admissions & Enrollment Information (Academic Session 2082 B.S.)**:

• 📢 **Status**: Admissions are officially **OPEN** for the upcoming academic session!
• 📝 **How to Apply**: You can easily fill out an online application by navigating to the **/apply** page on our website, or you can visit our school administration office in person during office hours (9:00 AM - 4:00 PM).
• ✏️ **Entrance Exam**: A mandatory entrance evaluation test is conducted for all new enrollments (from Grades 1 to 9, and Grades XI–XII) to ensure proper academic placement.
• 💰 **Scholarships**: NSVM offers generous scholarships based on:
  - Exceptional academic merit (high marks in previous exams/SEE).
  - Underprivileged, disabled, or marginalized background.
  - Outstanding talent in sports, arts, or extra-curricular activities.
• 💳 **Fees**: Our fee structure is highly competitive and structured to provide the highest value education. For specific class-wise fee breakdowns, please feel free to visit our administration office or call us at **099-525169**.`;
    }
    
    // Courses / Classes / Streams / Science / Management
    if (/course|subject|stream|science|management|class|grade|level|montessori|primary|secondary|neb|see|xi|xii|11|12|9|10/i.test(query)) {
      return `📚 **Academic Programs & Streams at New Saraswati Vidya Mandir**:

We offer structured, student-centric education from early childhood up to Grade 12:

1. 🌸 **Montessori & Pre-Primary**: A warm, caring, play-based environment designed to foster curiosity and foundational social skills.
2. 🏫 **Primary Level (Grades 1 to 5)**: Strong focus on foundational literacy, mathematical logic, science, and good habits.
3. 📖 **Lower Secondary Level (Grades 6 to 8)**: Emphasizes project-based learning, basic computers, and integrated science.
4. 🎓 **Secondary Level (Grades 9 & 10)**: Rigorous preparation for the Secondary Education Examination (SEE) board exams, along with practical science labs, computer education, and personal career counseling.
5. 🚀 **Higher Secondary Level (+2) (Grades 11 & 12 - NEB)**:
   - 🔬 **Science Stream**: Focused on deep physics, chemistry, biology, mathematics, and preparation for medical/engineering entrances.
   - 💼 **Management Stream**: Focused on accounting, business studies, economics, computer science, and leadership development.`;
    }

    // Facilities / Infrastructure / Labs
    if (/facilit|lab|computer|librar|sport|bus|transport|classroom|smart|projector|cafeteria|lunch|canteen|playground|hostel/i.test(query)) {
      return `🏫 **School Facilities & Infrastructure**:

At New Saraswati Vidya Mandir, we believe that world-class facilities are vital for modern education:

• 🔬 **Practical Science Labs**: Fully equipped, safe, and separate laboratories for **Physics**, **Chemistry**, and **Biology** to encourage learning-by-doing.
• 💻 **Modern Computer Lab**: Equipped with up-to-date computer systems, high-speed internet, and academic software.
• 📺 **Smart Classrooms**: Interactive classrooms equipped with multimedia projectors and audio systems for highly engaging, visual lessons.
• 📚 **Rich Library**: Home to thousands of reference books, encyclopedias, text books, fiction, and educational journals.
• 🚌 **School Bus Transportation**: Safe and reliable school bus services covering all major routes in Mahendranagar and surrounding areas.
• 🏀 **Sports & Recreation**: Dedicated facilities for basketball, table tennis, volleyball, badminton, and track-and-field athletics.
• 🍲 **Hygienic Cafeteria**: Serving fresh, nutritious, and hygienic vegetarian snacks and meals prepared with utmost care.`;
    }

    // Location / Contact / Where / Address / Phone / Email / Website
    if (/location|address|where|place|map|contact|phone|number|email|call|reach|site|website/i.test(query)) {
      return `📞 **Contact Information & Location**:

We would love to hear from you or welcome you to our beautiful campus!

• 📍 **Location**: Bheemdatt Municipality-18, Mahendranagar, Kanchanpur, Sudurpashchim Province, Nepal.
• ☎️ **Phone Number**: 099-525169 (Administration Office)
• ✉️ **Email Address**: info@nsvm.edu.np
• 🕒 **Office Hours**: Sunday to Friday, 9:00 AM to 4:00 PM.

You can also view our interactive location map on the **/contact** page of our website!`;
    }

    // Leadership / Principal / Staff / Teachers
    if (/principal|bhatt|leadership|director|founder|teacher|faculty|staff|coordinator/i.test(query)) {
      return `🧑‍💼 **Leadership & Faculty**:

• 👑 **Principal**: **Mr. Am Raj Bhatt**
  - A highly respected, visionary educational leader with decades of academic experience. 
  - He strongly advocates for character building, student discipline, interactive classrooms, and strong parent-teacher communication.
• 👨‍🏫 **Our Faculty**:
  - We have a team of over 40 highly qualified, experienced, and dedicated teachers across all levels.
  - Our Higher Secondary (+2) faculty consists of prominent subject experts from both Science and Management streams.
  - You can view our full department-wise secondary faculty profiles on the **/secondary-level-staffs** page, or our school-level teachers on the **/school-staffs** page!`;
    }

    // About / History / Establishment / Motto
    if (/about|history|establish|when|old|motto|tagline|saraswati|mandir|aim|vision|mission/i.test(query)) {
      return `ℹ️ **About New Saraswati Vidya Mandir**:

• 📅 **Established**: Founded in **2060 B.S. (2000 A.D.)** by a group of highly passionate and dedicated educators.
• 🌟 **Motto**: *"Quality | Confidence | Character"*
• 👥 **Student Community**: NSVM currently nurtures about **1300 students** from pre-primary to Higher Secondary level.
• 🎯 **Our Mission**: To deliver outstanding academic quality, foster unstoppable confidence, and build moral character in every student so they are prepared for local and global success.`;
    }

    // Catch-all general assistance response
    return `Thank you for your question! As the **Saraswati AI Assistant**, I am dedicated to providing information about our school.

Here are a few quick facts about **New Saraswati Vidya Mandir Secondary School**:
• 📍 Located in **Bheemdatt Municipality-18, Mahendranagar, Kanchanpur**.
• 🎓 Currently enrolling students for **academic session 2082 B.S.** (Management & Science for +2).
• 🔬 Well-equipped with **Science Labs, Computer Labs, and Smart Classrooms**.
• 📞 You can contact our administration at **099-525169** or visit our **/apply** page to enroll.

Could you please specify your query? For example, feel free to ask about:
1. *"How can I apply for admission?"*
2. *"What streams are offered in +2?"*
3. *"Tell me about school bus transportation"*
4. *"Who is the Principal?"*
5. *"Where is the school located?"*`;
  }

  const ROLE_INSTRUCTIONS: Record<string, string> = {
    assistant: SYSTEM_INSTRUCTION,
    admissions: `${SYSTEM_INSTRUCTION}\n\nSPECIAL ROLE: You are acting specifically as the Senior Admissions Officer at NSVM. Focus on admission criteria, application deadlines, Grade 11/12 +2 stream eligibility, entrance exam topics, and scholarship applications.`,
    tutor: `${SYSTEM_INSTRUCTION}\n\nSPECIAL ROLE: You are the Academic & Science Tutor at NSVM. Focus on helping students understand subjects (Physics, Chemistry, Biology, Mathematics, Accountancy, Computer Science, English, Nepali), providing clear step-by-step explanations for homework and exam prep.`,
    counselor: `${SYSTEM_INSTRUCTION}\n\nSPECIAL ROLE: You are the Student Career Counselor at NSVM. Focus on guiding students through career options after Grade 10 (SEE) and Grade 12 (NEB), stream selection (Management vs Science), time management, and confidence building.`,
  };

  // Chat rate limiter (max 40 requests per minute per IP)
  const chatRateLimits = new Map<string, { count: number; resetTime: number }>();

  app.post("/api/chat", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const limitRecord = chatRateLimits.get(ip) || { count: 0, resetTime: now + 60000 };
    if (now > limitRecord.resetTime) {
      limitRecord.count = 0;
      limitRecord.resetTime = now + 60000;
    }
    limitRecord.count += 1;
    chatRateLimits.set(ip, limitRecord);

    if (limitRecord.count > 40) {
      return res.status(429).json({ error: "Too many chat messages. Please wait a moment." });
    }

    const { message, history, model, role } = req.body || {};
    try {
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "A valid message string is required" });
      }

      // Bound message length to 1000 characters
      const cleanMessage = message.trim().slice(0, 1000);

      // Selected Gemini Model (gemini-3.5-flash, gemini-3.1-pro-preview, gemini-3.1-flash-lite)
      const selectedModel = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-live-preview"].includes(model)
        ? model
        : "gemini-3.5-flash";

      const activeSystemInstruction = ROLE_INSTRUCTIONS[role] || SYSTEM_INSTRUCTION;
      const genAI = getGenAIClient();

      // If the API Key is not configured or client failed, immediately use the intelligent local fallback
      if (!genAI || !process.env.GEMINI_API_KEY) {
        const reply = getFallbackResponse(cleanMessage);
        return res.json({ reply, model: "local-fallback", role: role || "assistant" });
      }

      const contents = [];
      if (Array.isArray(history)) {
        // Take at most last 12 turns to prevent token bloat
        const recentHistory = history.slice(-12);
        for (const turn of recentHistory) {
          if (turn && typeof turn.text === "string") {
            contents.push({
              role: turn.role === "user" ? "user" : "model",
              parts: [{ text: turn.text.slice(0, 800) }],
            });
          }
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: cleanMessage }],
      });

      const response = await genAI.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: activeSystemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || getFallbackResponse(cleanMessage);
      res.json({ reply, model: selectedModel, role: role || "assistant" });
    } catch (error: any) {
      console.error("Gemini API error (falling back to intelligent local responder):", error);
      const safeMessage = typeof message === "string" ? message : "";
      const reply = getFallbackResponse(safeMessage);
      res.json({ reply, model: "local-fallback", role: role || "assistant" });
    }
  });

  app.post("/api/admin/otp/request", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        return res.status(503).json({ message: "Admin OTP server is missing its Supabase server key." });
      }
      if (!resendApiKey) {
        return res.status(503).json({ message: "Admin OTP email delivery is not configured." });
      }
      const accessToken = getBearerToken(req);
      const user = accessToken ? await verifySupabaseAccessToken(accessToken) : null;
      if (!user?.id || !user.email) return res.status(401).json({ message: "Authentication required." });
      const admin = await getActiveAdmin(user.id);
      if (!admin) return res.status(403).json({ message: "Administrator authorization required." });

      const recentResponse = await supabaseRequest(
        `/rest/v1/admin_otp_challenges?select=id&user_id=eq.${encodeURIComponent(user.id)}&created_at=gte.${encodeURIComponent(new Date(Date.now() - 60 * 1000).toISOString())}&limit=1`,
      );
      const recentChallenges = await recentResponse.json() as Array<{ id?: string }>;
      if (recentChallenges.length > 0) return res.status(429).json({ message: "Please wait before requesting another code." });

      await supabaseRequest(`/rest/v1/admin_otp_challenges?user_id=eq.${encodeURIComponent(user.id)}&consumed_at=is.null`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumed_at: new Date().toISOString() }),
      });

      const code = String(crypto.randomInt(100000, 1000000));
      const challengeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabaseRequest("/rest/v1/admin_otp_challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ id: challengeId, user_id: user.id, email: user.email.toLowerCase(), code_hash: hashOtp(code), expires_at: expiresAt }),
      });
      await sendAdminOtp(user.email, code);
      res.json({ challengeId });
    } catch (error) {
      console.error("Admin OTP request failed:", error instanceof Error ? error.message : "unknown");
      res.status(503).json({ message: "Unable to send a verification code. Please try again later." });
    }
  });

  app.post("/api/admin/otp/verify", async (req, res) => {
    try {
      const accessToken = getBearerToken(req);
      const user = accessToken ? await verifySupabaseAccessToken(accessToken) : null;
      const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId : "";
      const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
      if (!user?.id || !challengeId || !/^\d{6}$/.test(code)) return res.status(401).json({ message: "Invalid or expired verification code." });
      const admin = await getActiveAdmin(user.id);
      if (!admin) return res.status(403).json({ message: "Administrator authorization required." });

      const response = await supabaseRequest(`/rest/v1/admin_otp_challenges?select=id,code_hash,attempts,expires_at&id=eq.${encodeURIComponent(challengeId)}&user_id=eq.${encodeURIComponent(user.id)}&consumed_at=is.null`);
      const rows = await response.json() as Array<{ id: string; code_hash: string; attempts: number; expires_at: string }>;
      const challenge = rows[0];
      if (!challenge || challenge.attempts >= 5 || Date.parse(challenge.expires_at) <= Date.now()) {
        return res.status(401).json({ message: "Invalid or expired verification code." });
      }
      if (hashOtp(code) !== challenge.code_hash) {
        await supabaseRequest(`/rest/v1/admin_otp_challenges?id=eq.${encodeURIComponent(challengeId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attempts: challenge.attempts + 1 }),
        });
        return res.status(401).json({ message: "Invalid or expired verification code." });
      }
      await supabaseRequest(`/rest/v1/admin_otp_challenges?id=eq.${encodeURIComponent(challengeId)}&user_id=eq.${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumed_at: new Date().toISOString() }),
      });
      res.json({ ok: true });
    } catch (error) {
      console.error("Admin OTP verification failed:", error instanceof Error ? error.message : "unknown");
      res.status(503).json({ message: "Unable to verify the code. Please try again later." });
    }
  });

  // Legacy server-side admin authentication is disabled. Supabase Auth plus
  // the email OTP endpoints above is the only supported administrator flow.
  app.use("/api/admin", (_req, res) => {
    res.status(410).json({ message: "Use Supabase Auth for administrator access." });
  });

  app.get("/api/admin/session", (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    res.json({ ok: verifySession(cookies[adminCookie]) });
  });

  app.post("/api/admin/password-challenge", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!(await verifyTurnstileToken(req.body?.turnstileToken, ip))) {
      console.warn("Admin password challenge blocked by Turnstile", { ip: hashAuditValue(ip) });
      return res.status(403).json({ message: "Complete the security check and try again." });
    }
    // Always use a generic response to avoid revealing which addresses are admins.
    if (!otpAdminEmail || email !== otpAdminEmail || !/^\S+@\S+\.\S+$/.test(email) || !password || !allowOtpRequest(ip, email)) {
      console.warn("Admin password challenge denied", { ip: hashAuditValue(ip), email: hashAuditValue(email) });
      return res.status(202).json({ ok: true });
    }
    try {
      const adminResponse = await supabaseRequest(
        `/rest/v1/admin_users?select=user_id&email=eq.${encodeURIComponent(email)}&is_active=is.true&limit=1`,
      );
      const admins = await adminResponse.json() as Array<{ user_id?: string }>;
      if (admins.length > 0 && admins[0]?.user_id) {
        // Verify the password server-side. The resulting Auth session is never
        // sent to the browser; browser access starts only after OTP verification.
        await supabaseRequest("/auth/v1/token?grant_type=password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        await supabaseRequest("/auth/v1/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, create_user: false }),
        });
        console.info("Admin password verified; OTP requested", { ip: hashAuditValue(ip), email: hashAuditValue(email) });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown";
      console.error("Admin password challenge error", { ip: hashAuditValue(ip), error: errorMessage });
      if (errorMessage.includes("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing")) {
        return res.status(503).json({ message: "Admin authentication is not configured on the server." });
      }
      if (errorMessage.includes("Supabase request failed (400)") || errorMessage.includes("Supabase request failed (401)")) {
        return res.status(401).json({ message: "Invalid administrator email or password." });
      }
      return res.status(503).json({ message: "Unable to verify administrator credentials. Please try again later." });
    }
    return res.status(202).json({ ok: true });
  });

  app.post("/api/admin/request-otp", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!(await verifyTurnstileToken(req.body?.turnstileToken, ip))) {
      console.warn("Admin OTP request blocked by Turnstile", { ip: hashAuditValue(ip) });
      return res.status(403).json({ message: "Complete the security check and try again." });
    }
    if (!otpAdminEmail || email !== otpAdminEmail || !/^\S+@\S+\.\S+$/.test(email) || !allowOtpRequest(ip, email)) {
      console.warn("Admin direct OTP denied", { ip: hashAuditValue(ip), email: hashAuditValue(email) });
      return res.status(202).json({ ok: true });
    }
    try {
      await supabaseRequest("/auth/v1/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, create_user: false }),
      });
      console.info("Admin direct OTP requested", { ip: hashAuditValue(ip), email: hashAuditValue(email) });
    } catch (error) {
      console.error("Admin direct OTP error", { ip: hashAuditValue(ip), error: error instanceof Error ? error.message : "unknown" });
    }
    return res.status(202).json({ ok: true });
  });

  app.post("/api/admin/request-password-reset", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!(await verifyTurnstileToken(req.body?.turnstileToken, ip))) {
      console.warn("Admin password reset blocked by Turnstile", { ip: hashAuditValue(ip) });
      return res.status(403).json({ message: "Complete the security check and try again." });
    }
    if (!appUrl) return res.status(503).json({ message: "Password recovery is not configured. Contact the site owner." });
    // Always give the same response so this endpoint cannot confirm the admin email.
    if (!otpAdminEmail || email !== otpAdminEmail || !/^\S+@\S+\.\S+$/.test(email) || !allowOtpRequest(ip, email)) {
      console.warn("Admin password reset denied", { ip: hashAuditValue(ip), email: hashAuditValue(email) });
      return res.status(202).json({ ok: true });
    }
    try {
      const response = await supabaseRequest("/auth/v1/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirect_to: `${appUrl}/admin?reset_password=1` }),
      });
      if (!response.ok) throw new Error(`Supabase recovery request failed with ${response.status}`);
      console.info("Admin password reset requested", { ip: hashAuditValue(ip), email: hashAuditValue(email) });
    } catch (error) {
      console.error("Admin password reset error", { ip: hashAuditValue(ip), error: error instanceof Error ? error.message : "unknown" });
    }
    return res.status(202).json({ ok: true });
  });

  app.post("/api/admin/verify-otp", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!(await verifyTurnstileToken(req.body?.turnstileToken, ip))) {
      console.warn("Admin OTP verification blocked by Turnstile", { ip: hashAuditValue(ip) });
      return res.status(403).json({ message: "Complete the security check and try again." });
    }
    if (!otpAdminEmail || email !== otpAdminEmail || !/^\d{6,8}$/.test(token)) {
      return res.status(401).json({ message: "The verification code is invalid or expired." });
    }
    try {
      const response = await supabaseRequest("/auth/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, type: "email" }),
      });
      if (!response.ok) return res.status(401).json({ message: "The verification code is invalid or expired." });
      const session = await response.json() as { access_token?: string; refresh_token?: string };
      if (!session.access_token || !session.refresh_token) {
        return res.status(401).json({ message: "The verification code is invalid or expired." });
      }
      return res.json({ accessToken: session.access_token, refreshToken: session.refresh_token });
    } catch (error) {
      console.error("Admin OTP verification error", { ip: hashAuditValue(ip), error: error instanceof Error ? error.message : "unknown" });
      return res.status(503).json({ message: "Unable to verify the code. Please try again later." });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const rateKey = `admin_${ip}`;
    if (!(await verifyTurnstileToken(req.body?.turnstileToken, ip))) {
      console.warn("Admin login blocked by Turnstile", { ip: hashAuditValue(ip) });
      return res.status(403).json({ message: "Complete the security check and try again." });
    }
    if (isRateLimited(rateKey)) {
      res.status(429).json({ message: "Too many failed login attempts. Locked for 15 minutes." });
      return;
    }

    const inputEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const inputPass = typeof req.body?.password === "string" ? req.body.password : "";

    // If ADMIN_EMAIL is set and an email is supplied, verify it matches
    if (adminEmail && inputEmail && inputEmail !== adminEmail) {
      recordFailedAttempt(rateKey);
      res.status(401).json({ message: "Invalid admin email or password" });
      return;
    }

    // Require explicit admin password in environment variable if using server login
    if (!adminPassword || !inputPass || !safeComparePassword(inputPass, adminPassword)) {
      recordFailedAttempt(rateKey);
      res.status(401).json({ message: "Invalid admin credentials or server login not configured" });
      return;
    }

    clearAttempts(rateKey);
    const token = signSession(`admin:${Date.now()}`);
    const secureFlag = isProduction ? "Secure; " : "";
    res.setHeader(
      "Set-Cookie",
      `${adminCookie}=${encodeURIComponent(token)}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=604800`,
    );
    res.json({ ok: true, email: inputEmail || adminEmail });
  });

  app.post("/api/admin/logout", (_req, res) => {
    const secureFlag = isProduction ? "Secure; " : "";
    res.setHeader("Set-Cookie", `${adminCookie}=; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=0`);
    res.json({ ok: true });
  });

  app.put("/api/admin/content", requireAdmin, async (req, res) => {
    res.json(await writeContent(req.body));
  });

  // Applications storage
  const applicationsFile = path.join(contentDir, "applications.json");
  async function loadApplications() {
    try {
      await fs.access(applicationsFile);
      const raw = await fs.readFile(applicationsFile, "utf8");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async function saveApplication(application: unknown) {
    const applications = await loadApplications();
    const newApp = {
      ...(application as Record<string, unknown>),
      id: crypto.randomBytes(8).toString("hex"),
      submittedAt: new Date().toISOString(),
    };
    applications.push(newApp);
    await fs.writeFile(applicationsFile, JSON.stringify(applications, null, 2), "utf8");
    return newApp;
  }

  // Rate limit application submissions by IP
  const applicationSubmissions = new Map<string, number>();
  
  app.post(["/api/applications", "/api/admin/applications"], async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
      const now = Date.now();
      const lastSubmit = applicationSubmissions.get(ip) || 0;
      if (now - lastSubmit < 10000) { // 10 second delay between submissions
        return res.status(429).json({ message: "Please wait a few seconds before submitting another application." });
      }

      const { fullName, phone, email, grade, parentName, address, remarks } = req.body || {};
      if (!fullName || typeof fullName !== "string" || !phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Full Name and Phone Number are required fields." });
      }

      // Sanitize fields to prevent XSS in admin panel
      const sanitize = (str: unknown) => typeof str === "string" ? str.replace(/[<>]/g, "").trim().slice(0, 500) : "";

      const sanitizedApp = {
        fullName: sanitize(fullName),
        phone: sanitize(phone),
        email: sanitize(email),
        grade: sanitize(grade),
        parentName: sanitize(parentName),
        address: sanitize(address),
        remarks: sanitize(remarks),
      };

      applicationSubmissions.set(ip, now);
      const saved = await saveApplication(sanitizedApp);
      res.status(201).json(saved);
    } catch (error: any) {
      console.error("Application save error:", error);
      res.status(500).json({ message: "Failed to save application" });
    }
  });

  app.get("/api/admin/applications", requireAdmin, async (_req, res) => {
    try {
      const applications = await loadApplications();
      res.json(applications);
    } catch (error: any) {
      console.error("Applications load error:", error);
      res.status(500).json({ message: "Failed to load applications" });
    }
  });

  app.post("/api/admin/upload", requireAdmin, async (req, res) => {
    const { fileName, dataUrl } = req.body || {};
    const match = typeof dataUrl === "string" ? dataUrl.match(/^data:(.+);base64,(.+)$/) : null;
    if (!fileName || !match) {
      res.status(400).json({ message: "Expected fileName and base64 dataUrl" });
      return;
    }

    // Validate MIME type
    const mimeType = match[1];
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimes.includes(mimeType)) {
      res.status(400).json({ message: `File type ${mimeType} not allowed. Allowed: images (JPEG, PNG, GIF, WebP), PDF, Word documents` });
      return;
    }

    // Validate file size (10MB max)
    const buffer = Buffer.from(match[2], "base64");
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      res.status(400).json({ message: `File size exceeds 10MB limit (${(buffer.length / 1024 / 1024).toFixed(2)}MB)` });
      return;
    }

    const safeName = safeUploadName(fileName);
    if (useSupabaseStore()) {
      await supabaseRequest(`/storage/v1/object/${supabaseStorageBucket}/${safeName}`, {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000",
          "x-upsert": "true",
        },
        body: buffer,
      });
      res.json({ url: `${supabaseUrl}/storage/v1/object/public/${supabaseStorageBucket}/${safeName}` });
      return;
    }

    await fs.writeFile(path.join(uploadsDir, safeName), buffer);
    res.json({ url: `/uploads/${safeName}` });
  });

  // Serve static files from dist/public in production or client/public in development
  const staticPath = path.resolve(process.cwd(), "dist", "public");
  const publicPath = isProduction
    ? staticPath
    : path.resolve(process.cwd(), "client", "public");

  app.use(
    express.static(publicPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/i)) {
          res.set("Cache-Control", "public, max-age=604800, immutable");
        }
      },
    })
  );

  app.use(
    "/images",
    express.static(path.join(publicPath, "images"), {
      maxAge: "7d",
      setHeaders: (res, filePath) => {
        if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/i)) {
          res.set("Cache-Control", "public, max-age=604800, immutable");
        }
      },
    })
  );

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateDynamicSitemapXml(content: any, baseUrl = "https://nsvm.edu.np"): string {
  const today = new Date().toISOString().split("T")[0];
  const lastmod = content?.updatedAt
    ? new Date(content.updatedAt).toISOString().split("T")[0]
    : today;

  const galleryItems = Array.isArray(content?.gallery) ? content.gallery : [];
  const noticeItems = Array.isArray(content?.notices) ? content.notices : [];

  // Collect faculty images for staffs pages
  const schoolStaffMembers: any[] = [];
  if (Array.isArray(content?.faculty?.schoolStaffCategories)) {
    content.faculty.schoolStaffCategories.forEach((cat: any) => {
      if (Array.isArray(cat.members)) {
        schoolStaffMembers.push(...cat.members);
      }
    });
  }

  const secondaryStaffMembers: any[] = [];
  if (Array.isArray(content?.faculty?.secondaryDepartments)) {
    content.faculty.secondaryDepartments.forEach((dept: any) => {
      if (Array.isArray(dept.members)) {
        secondaryStaffMembers.push(...dept.members);
      }
    });
  }

  const formatImageUrl = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    const cleanSrc = src.startsWith("/") ? src : `/${src}`;
    return `${baseUrl}${cleanSrc}`;
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Core Main Page (Home) -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
    <image:image>
      <image:loc>${baseUrl}/images/branding/school-logo.jpg</image:loc>
      <image:title>${escapeXml("New Saraswati Vidya Mandir Secondary School Logo (newsaraswati)")}</image:title>
      <image:caption>${escapeXml("Official emblem and logo of New Saraswati Vidya Mandir, BDM-12 Airy, Kanchanpur")}</image:caption>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/images/gallery/school-background.jpg</image:loc>
      <image:title>${escapeXml("New Saraswati Vidya Mandir School Campus Building")}</image:title>
      <image:caption>${escapeXml("Modern academic infrastructure and campus ground at Airy, Kanchanpur")}</image:caption>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/images/staff/principal-AMRAJ-BHATT-SIR.webp</image:loc>
      <image:title>${escapeXml("Principal Amraj Bhatt - New Saraswati Vidya Mandir")}</image:title>
      <image:caption>${escapeXml("Leadership and vision message by Principal Amraj Bhatt")}</image:caption>
    </image:image>
  </url>

  <!-- About School & Leadership -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/about?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/about?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/about" />
    <image:image>
      <image:loc>${baseUrl}/images/staff/principal-AMRAJ-BHATT-SIR.webp</image:loc>
      <image:title>${escapeXml("Principal Amraj Bhatt")}</image:title>
      <image:caption>${escapeXml("Academic leadership and vision at New Saraswati Vidya Mandir")}</image:caption>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/images/staff/suresh-bhandari.webp</image:loc>
      <image:title>${escapeXml("Chairperson Suresh Bhandari")}</image:title>
      <image:caption>${escapeXml("School Management Committee Chairperson")}</image:caption>
    </image:image>
  </url>

  <!-- Academic Programs (Montessori to Grade 12 Management) -->
  <url>
    <loc>${baseUrl}/courses</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/courses?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/courses?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/courses" />
    <image:image>
      <image:loc>${baseUrl}/images/gallery/food-fest-and-science-exchibition-gal.jpg</image:loc>
      <image:title>${escapeXml("Practical Science & Business Exhibition at NSVM")}</image:title>
      <image:caption>${escapeXml("Hands-on learning and practical management workshops for students")}</image:caption>
    </image:image>
  </url>

  <!-- Online Admission 2082 BS -->
  <url>
    <loc>${baseUrl}/apply</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/apply?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/apply?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/apply" />
    <image:image>
      <image:loc>${baseUrl}/images/gallery/cover-page1.jpg</image:loc>
      <image:title>${escapeXml("Online Student Admission 2082 B.S. - New Saraswati Vidya Mandir")}</image:title>
      <image:caption>${escapeXml("Enrollment open from Montessori to Grade 12 (+2 Management)")}</image:caption>
    </image:image>
  </url>

  <!-- Notices, Circulars & Exam Routines -->
  <url>
    <loc>${baseUrl}/notices</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.90</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/notices?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/notices?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/notices" />
  </url>

  <!-- Contact & Directions -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/contact?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/contact?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/contact" />
  </url>

  <!-- School Staffs & Faculty -->
  <url>
    <loc>${baseUrl}/school-staffs</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/school-staffs?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/school-staffs?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/school-staffs" />
${schoolStaffMembers
  .filter((m: any) => m.image)
  .slice(0, 10)
  .map(
    (m: any) => `    <image:image>
      <image:loc>${formatImageUrl(m.image)}</image:loc>
      <image:title>${escapeXml(`${m.name} - ${m.designation || "Faculty"}`)}</image:title>
      <image:caption>${escapeXml(`Faculty member at New Saraswati Vidya Mandir: ${m.expertise || m.officialRole || m.designation}`)}</image:caption>
    </image:image>`
  )
  .join("\n")}
  </url>

  <!-- Secondary & +2 Level Staffs -->
  <url>
    <loc>${baseUrl}/secondary-staffs</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/secondary-staffs?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/secondary-staffs?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/secondary-staffs" />
${secondaryStaffMembers
  .filter((m: any) => m.image)
  .slice(0, 10)
  .map(
    (m: any) => `    <image:image>
      <image:loc>${formatImageUrl(m.image)}</image:loc>
      <image:title>${escapeXml(`${m.name} - ${m.designation || "Secondary Faculty"}`)}</image:title>
      <image:caption>${escapeXml(`Secondary & +2 Management teacher at NSVM: ${m.subject || m.designation}`)}</image:caption>
    </image:image>`
  )
  .join("\n")}
  </url>

  <!-- Photo Gallery & Campus Life with ALL images -->
  <url>
    <loc>${baseUrl}/gallery</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/gallery?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/gallery?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/gallery" />
${galleryItems
  .filter((img: any) => img.src)
  .map(
    (img: any) => `    <image:image>
      <image:loc>${formatImageUrl(img.src)}</image:loc>
      <image:title>${escapeXml(img.title || "School Gallery Photo - New Saraswati Vidya Mandir")}</image:title>
      <image:caption>${escapeXml(img.desc || img.title || "Campus life, sports, exhibitions, and cultural activities at NSVM")}</image:caption>
    </image:image>`
  )
  .join("\n")}
  </url>

  <!-- 3D Virtual Tour -->
  <url>
    <loc>${baseUrl}/virtual-tour</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.80</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/virtual-tour?lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/virtual-tour?lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/virtual-tour" />
  </url>

  <!-- Dynamic Individual Notice & Announcement Posts -->
${noticeItems
  .map((notice: any) => {
    const noticeDate = notice.date ? notice.date.slice(0, 10) : lastmod;
    const categoryTitle = notice.category ? `[${notice.category.toUpperCase()}] ` : "";
    return `  <url>
    <loc>${baseUrl}/notices?id=${encodeURIComponent(String(notice.id))}</loc>
    <lastmod>${noticeDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/notices?id=${encodeURIComponent(String(notice.id))}&amp;lang=en" />
    <xhtml:link rel="alternate" hreflang="ne" href="${baseUrl}/notices?id=${encodeURIComponent(String(notice.id))}&amp;lang=ne" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/notices?id=${encodeURIComponent(String(notice.id))}" />
    <image:image>
      <image:loc>${baseUrl}/images/branding/school-logo.jpg</image:loc>
      <image:title>${escapeXml(`${categoryTitle}${notice.title || "School Notice"} - New Saraswati Vidya Mandir`)}</image:title>
      <image:caption>${escapeXml(notice.content?.introduction || notice.title || "Official Announcement from NSVM")}</image:caption>
    </image:image>
  </url>`;
  })
  .join("\n\n")}

</urlset>
`;

  return xml.trim();
}

  app.get("/sw.js", (_req, res) => {
    res.type("application/javascript");
    res.set("Cache-Control", "public, max-age=0, must-revalidate");
    res.sendFile(path.join(publicPath, "sw.js"));
  });

  app.get("/manifest.json", (_req, res) => {
    res.type("application/manifest+json");
    res.set("Cache-Control", "public, max-age=3600");
    res.sendFile(path.join(publicPath, "manifest.json"));
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const content = await readContent();
      const protocol = req.protocol || "https";
      const host = req.get("host") || "nsvm.edu.np";
      const baseUrl = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("run.app")
        ? `${protocol}://${host}`
        : "https://nsvm.edu.np";
      
      const xml = generateDynamicSitemapXml(content, baseUrl);
      res.type("application/xml");
      res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
      res.send(xml);
    } catch (err) {
      console.error("Error generating dynamic sitemap:", err);
      res.type("application/xml");
      res.sendFile(path.join(publicPath, "sitemap.xml"));
    }
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.set("Cache-Control", "public, max-age=86400");
    res.sendFile(path.join(publicPath, "robots.txt"));
  });

  // Global Express Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled server error:", err);
    if (res.headersSent) return;
    res.status(err.status || 500).json({
      message: isProduction ? "An unexpected server error occurred." : err.message || "Internal server error",
    });
  });

  if (isProduction) {
    app.use(
      express.static(staticPath, {
        maxAge: "7d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.set("Cache-Control", "no-cache");
          } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|webp)$/)) {
            res.set("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      }),
    );

    // Handle client-side routing - serve index.html for all routes
    app.get("*", (_req, res) => {
      res.set("Cache-Control", "no-cache");
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  const server = createServer(app);
  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 3000);

  server.listen(port, host, () => {
    console.log(`Server running on http://localhost:${port}/`);
    const addresses = getLocalNetworkAddresses();
    if (addresses.length > 0) {
      console.log(`Open it on your phone using: ${addresses.map((address) => `http://${address}:${port}/`).join(" | ")}`);
    }
  });
}

if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}
