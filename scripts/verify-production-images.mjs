import fs from "fs";
import path from "path";

const root = process.cwd();
const publicDir = path.join(root, "client/public");

function walk(dir, files = [], filter) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files, filter);
    else if (!filter || filter(e.name, p)) files.push(p);
  }
  return files;
}

const codeFiles = walk(root, [], (name) =>
  /\.(ts|tsx|js|jsx|css|json|html)$/i.test(name) && !name.includes("package-lock"),
);

const found = new Set();
const missing = [];
const re = /\/images\/[^"'`\s]+/g;

for (const file of codeFiles) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = re.exec(text))) {
    const p = m[0].replace(/[.,;:]+$/, "");
    found.add(p);
    const disk = path.join(publicDir, p.replace(/^\//, "").replace(/\//g, path.sep));
    if (!fs.existsSync(disk)) {
      missing.push({ p, file: path.relative(root, file) });
    }
  }
}

const images = walk(path.join(publicDir, "images"));
const badFiles = [];
for (const f of images) {
  const b = fs.readFileSync(f);
  const ok =
    (b[0] === 0xff && b[1] === 0xd8) ||
    (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e) ||
    b.toString("ascii", 0, 4) === "RIFF";
  if (!ok) badFiles.push(path.relative(root, f));
}

const parenRefs = [...found].filter((p) => p.includes("("));
const leftovers = [];
for (const file of codeFiles) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/radiantmnr|school background\.jpg|unsplash\.com/i.test(line)) {
      leftovers.push(`${path.relative(root, file)}:${i + 1} ${line.trim().slice(0, 140)}`);
    }
  });
}

console.log("Referenced /images paths:", found.size);
console.log("Missing refs:", missing.length);
missing.forEach((x) => console.log("  MISS", x.p, "<-", x.file));
console.log("Corrupt image files on disk:", badFiles.length);
badFiles.forEach((f) => console.log("  BAD", f));
console.log("Parenthetical path refs left:", parenRefs.length);
parenRefs.forEach((p) => console.log("  PAREN", p));
console.log("Branding leftovers:", leftovers.length);
leftovers.forEach((l) => console.log("  ", l));

const ok = missing.length === 0 && badFiles.length === 0 && parenRefs.length === 0;
console.log(ok ? "\nPASS: production image check OK" : "\nFAIL: issues remain");
process.exit(ok ? 0 : 1);
