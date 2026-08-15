import fs from "fs";
import path from "path";

const root = "E:/NEW SARASWATI";

const staffNorm = new Set([
  "principal-AMRAJ-BHATT-SIR.webp",
  "principal-sir-gal.jpg",
  "vice-principal.jpg",
  "deep-zenith-exam-coordinator.jpg",
  "dipak-joshi.jpg",
  "harendra-pant.webp",
  "keshab-pant.jpg",
  "lavdev-joshi.jpg",
  "niranjana-rawal.webp",
  "padama-pathak.webp",
  "rewati-joshi-bhatt.webp",
  "sabina-bhandari.webp",
  "shila-acharya.webp",
  "sunil-pandey.png",
  "sunil-pandey.jpeg",
  "suresh-bhandari.webp",
  "janaki-saud.webp",
  "jyoti-joshi-accountant.webp",
]);

function normalizeStaffName(name) {
  const map = {
    "principal amraj bhatt sir.jpg": "principal-AMRAJ-BHATT-SIR.webp",
    "principal sir gal.jpg": "principal-sir-gal.jpg",
    "vice principal.jpg": "vice-principal.jpg",
    "deep zenith exam coordinator.jpg": "deep-zenith-exam-coordinator.jpg",
    "dipak joshi.jpg": "dipak-joshi.jpg",
    "harendra pant.jpg": "harendra-pant.webp",
    "keshab pant.jpg": "keshab-pant.jpg",
    "lavdev joshi.jpg": "lavdev-joshi.jpg",
    "niranjana rawal.jpg": "niranjana-rawal.webp",
    "padama pathak.jpg": "padama-pathak.webp",
    "rewati joshi bhatt.jpg": "rewati-joshi-bhatt.webp",
    "sabina bhandari.jpg": "sabina-bhandari.webp",
    "shila acharya.jpg": "shila-acharya.webp",
    "sunil pandey.png": "sunil-pandey.png",
    "suresh bhandari.jpg": "suresh-bhandari.webp",
    "janaki saud.jpg": "janaki-saud.webp",
    "jyoti joshi accountant.jpg": "jyoti-joshi-accountant.webp",
  };
  const lower = name.toLowerCase();
  if (map[lower]) return map[lower];
  return name.replace(/ /g, "-");
}

function rewriteGalleryOrStaff(file) {
  const normalized = normalizeStaffName(file.trim());
  if (staffNorm.has(normalized) || staffNorm.has(file.trim())) {
    return `/images/staff/${staffNorm.has(normalized) ? normalized : file.trim()}`;
  }
  return `/images/gallery/${file.trim().replace(/ /g, "-")}`;
}

function rewriteText(text) {
  let u = text;
  u = u.replace(/\/radiant-assets\//g, "/images/branding/");
  u = u.replace(
    /https:\/\/radiantmnr\.edu\.np\/radiant-assets\//g,
    "https://radiantmnr.edu.np/images/branding/",
  );
  u = u.replace(
    /https:\/\/radiantmnr\.edu\.np\/radiant-gallery\//g,
    (m) => m.replace("/radiant-gallery/", "/images/gallery/"),
  );
  // paths like /radiant-gallery/foo bar.jpg or /radiant-gallery/foo-bar.jpg
  u = u.replace(/\/radiant-gallery\/([^"'`)\s]+(?:\s[^"'`)\s]+)*)/g, (_full, file) =>
    rewriteGalleryOrStaff(file),
  );
  // any remaining simple radiant-gallery refs
  u = u.replace(/\/radiant-gallery\//g, "/images/gallery/");
  return u;
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ["node_modules", "dist", "temp-repo", "temp-repo-clone", ".git", "images"].includes(
        ent.name,
      )
    ) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|js|jsx|css|json|html|md)$/i.test(ent.name)) files.push(p);
  }
  return files;
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  if (file.includes("package-lock")) continue;
  if (file.includes(`${path.sep}public${path.sep}images${path.sep}`)) continue;
  let text = fs.readFileSync(file, "utf8");
  if (!text.includes("radiant-gallery") && !text.includes("radiant-assets")) continue;
  const next = rewriteText(text);
  if (next !== text) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
    console.log("updated", path.relative(root, file));
  }
}
console.log("Files updated:", changed);
