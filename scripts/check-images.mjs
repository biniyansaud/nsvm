import fs from "fs";
import path from "path";

const root = process.cwd();
const publicDir = path.join(root, "client/public");

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|js|jsx|css|json|html|md)$/i.test(e.name)) files.push(p);
  }
  return files;
}

const files = walk(root).filter(
  (f) => !f.includes("package-lock") && !f.includes(`${path.sep}public${path.sep}images${path.sep}`),
);

const re = /\/images\/[^"'`\s\)]+/g;
const missing = new Map();
const found = new Set();

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = re.exec(text))) {
    const p = m[0].replace(/[.,;:]+$/, "");
    found.add(p);
    const disk = path.join(publicDir, p.replace(/^\//, "").replace(/\//g, path.sep));
    if (!fs.existsSync(disk)) {
      if (!missing.has(p)) missing.set(p, []);
      missing.get(p).push(path.relative(root, file));
    }
  }
}

console.log("Unique /images paths:", found.size);
console.log("Missing count:", missing.size);
for (const [p, refs] of missing) {
  console.log("MISS", p);
  console.log("  from", [...new Set(refs)].slice(0, 8).join(", "));
}

const oldPatterns = [
  /radiant-gallery/,
  /radiant-assets/,
  /school background/,
  /via\.placeholder/,
  /placehold\.co/,
  /picsum\.photos/,
  /unsplash\.com/,
  /radiantmnr\.edu\.np/,
];

console.log("\n=== Old / external image patterns ===");
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  for (const pat of oldPatterns) {
    lines.forEach((line, i) => {
      if (pat.test(line)) {
        console.log(
          "OLD",
          `${path.relative(root, file)}:${i + 1}`,
          line.trim().slice(0, 160),
        );
      }
    });
  }
}

// Disk inventory vs references for staff
console.log("\n=== Staff files ===");
const staffDir = path.join(publicDir, "images/staff");
for (const f of fs.readdirSync(staffDir)) {
  console.log(" ", f);
}

// Check siteContent faculty images
console.log("\n=== siteContent image paths ===");
const sc = fs.readFileSync(path.join(root, "client/src/lib/siteContent.ts"), "utf8");
const scImgs = [...sc.matchAll(/image:\s*"([^"]+)"/g)].map((x) => x[1]);
for (const img of scImgs) {
  const disk = path.join(publicDir, img.replace(/^\//, "").replace(/\//g, path.sep));
  console.log(fs.existsSync(disk) ? "OK" : "MISS", img);
}
