import fs from "fs";

const p = "E:/NEW SARASWATI/server/index.ts";
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf("const seedContent = {");
const end = s.indexOf("function signSession");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `async function loadSeedContent() {
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

`;

s = s.slice(0, start) + replacement + s.slice(end);

// Prefer persistent data/ folder in all environments unless CONTENT_DIR is set
s = s.replace(
  /const contentDir = process\.env\.CONTENT_DIR\s*\? path\.resolve\(process\.env\.CONTENT_DIR\)\s*: isProduction\s*\? path\.join\(os\.tmpdir\(\), "radiant-data"\)\s*: path\.resolve\(process\.cwd\(\), "data"\);/,
  `const contentDir = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.resolve(process.cwd(), "data");`,
);

s = s.replace(
  'await fs.writeFile(contentFile, JSON.stringify(seedContent, null, 2), "utf8");',
  'await fs.writeFile(contentFile, JSON.stringify(await getSeedContent(), null, 2), "utf8");',
);

s = s.replace(
  "return writeSupabaseContent(seedContent);",
  "return writeSupabaseContent(await getSeedContent());",
);

s = s.replace(
  /const staticPath = isProduction\s*\? path\.resolve\(resolvedDirname, "public"\)\s*: path\.resolve\(resolvedDirname, "\.\.", "dist", "public"\);/,
  'const staticPath = path.resolve(process.cwd(), "dist", "public");',
);

fs.writeFileSync(p, s);
console.log("server/index.ts refactored, length=", s.length);
console.log("has old seed object?", s.includes("const seedContent = {"));
console.log("has getSeedContent?", s.includes("getSeedContent"));
console.log("staticPath ok?", s.includes('path.resolve(process.cwd(), "dist", "public")'));
