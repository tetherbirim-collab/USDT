import { readdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";

const FROM = "clayadmnxx";
const TO = "clayadm!nxx";
const root = path.resolve("out");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  const dirs = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(full);
      files.push(...nested.files);
      dirs.push(...nested.dirs);
      if (entry.name === FROM) dirs.push(full);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return { files, dirs };
}

const { files, dirs } = await walk(root);
let rewritten = 0;
for (const file of files) {
  const buf = await readFile(file);
  if (buf.includes(0)) continue;
  const text = buf.toString("utf8");
  if (!text.includes(FROM)) continue;
  await writeFile(file, text.replaceAll(FROM, TO));
  rewritten += 1;
}

dirs.sort((a, b) => b.length - a.length);
for (const dir of dirs) {
  await rename(dir, path.join(path.dirname(dir), TO));
}

if (rewritten === 0 || dirs.length === 0) {
  console.error(`admin path publish failed: files=${rewritten} dirs=${dirs.length}`);
  process.exit(1);
}

console.log(`published /${TO}: ${rewritten} files, ${dirs.length} directories`);
