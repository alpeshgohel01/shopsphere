import fs from "fs";

const files = [
  "src/components/auth/AuthLayout.jsx",
  "src/components/auth/AuthVisual.jsx",
  "src/components/auth/AuthCard.jsx",
  "src/lib/auth-images.js",
  "src/app/(auth)/sign-in/page.jsx",
  "src/app/(auth)/sign-up/page.jsx",
];

for (const f of files) {
  const buf = fs.readFileSync(f);
  let text;
  try {
    const asUtf8 = buf.toString("utf8");
    text =
      Buffer.compare(Buffer.from(asUtf8, "utf8"), buf) === 0
        ? asUtf8
        : buf.toString("latin1");
  } catch {
    text = buf.toString("latin1");
  }

  text = text
    .replaceAll("\u2014", "--")
    .replaceAll("\u2013", "-")
    .replaceAll("\u00B7", ".")
    .replaceAll("\u2022", "*")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201C", '"')
    .replaceAll("\u201D", '"')
    .replaceAll("\u2026", "...")
    .replaceAll("\u00A0", " ")
    .replaceAll("Â·", ".");

  text = [...text]
    .map((ch) => (ch.codePointAt(0) < 128 ? ch : ""))
    .join("");

  fs.writeFileSync(f, text, "utf8");
  const out = fs.readFileSync(f);
  let high = 0;
  for (const x of out) if (x > 127) high += 1;
  console.log("fixed", f, "high", high);
}
