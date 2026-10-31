import fs from "fs";
import path from "path";

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (
      e.isDirectory() &&
      !["node_modules", ".git", ".next", "test-results"].includes(e.name)
    ) {
      walk(p, acc);
    } else if (/\.(js|jsx|mjs|css|md|json)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

function isValidUtf8(buf) {
  try {
    const t = buf.toString("utf8");
    return Buffer.compare(Buffer.from(t, "utf8"), buf) === 0;
  } catch {
    return false;
  }
}

function polish(s) {
  return s
    .replaceAll("\u2013", "-")
    .replaceAll("\u2014", "--")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201C", '"')
    .replaceAll("\u201D", '"')
    .replaceAll("\u2026", "...")
    .replaceAll("\u00A0", " ");
}

function latin1ToAscii(s) {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c < 128) out += ch;
    else if (c === 0x97 || c === 0x96) out += "-";
    else if (c === 0x91 || c === 0x92) out += "'";
    else if (c === 0x93 || c === 0x94) out += '"';
    else if (c === 0xa0) out += " ";
    else out += "";
  }
  return out;
}

const files = ["src", "scripts"]
  .flatMap((r) => (fs.existsSync(r) ? walk(r) : []))
  .concat(
    ["package.json", ".env.example", "README.md", "AGENTS.md"].filter((f) =>
      fs.existsSync(f),
    ),
  );

let fixed = 0;
for (const f of files) {
  const buf = fs.readFileSync(f);
  let next;
  if (isValidUtf8(buf)) {
    const text = polish(buf.toString("utf8"));
    next = text;
    if (text === buf.toString("utf8") && isValidUtf8(Buffer.from(text, "utf8"))) {
      continue;
    }
  } else {
    next = polish(latin1ToAscii(buf.toString("latin1")));
  }
  fs.writeFileSync(f, next, "utf8");
  fixed += 1;
  console.log("fixed", f);
}
console.log("done", fixed);
