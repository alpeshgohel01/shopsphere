import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && !["node_modules", ".next"].includes(e.name)) walk(p, a);
    else if (/\.(js|jsx|mjs)$/.test(e.name)) a.push(p);
  }
  return a;
}

// Heuristic: string literal that closes then has identifier (broken emdash)
const broken = /"[^"\n]*"\s+[A-Za-z]/;

for (const f of walk("src")) {
  const t = fs.readFileSync(f, "utf8");
  const lines = t.split(/\n/);
  lines.forEach((l, i) => {
    // Ignore common false positives like className="x" something
    if (!broken.test(l)) return;
    if (l.includes("className=") || l.includes("href=") || l.includes("variant=")) return;
    if (l.trim().startsWith("//") || l.trim().startsWith("*")) return;
    // title/description/label style broken strings
    if (
      /default:\s*"/.test(l) ||
      /absolute:\s*"/.test(l) ||
      /description:/.test(l) ||
      /label:\s*"/.test(l) ||
      /"[^"]*"\s+[a-z]/.test(l)
    ) {
      console.log(`${f}:${i + 1}:${l.trim()}`);
    }
  });
}
