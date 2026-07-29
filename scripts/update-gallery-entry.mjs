import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  archiveRoot,
  buildArchiveEntry,
  galleryDataFile,
  readGalleryPayload,
  root,
  upsertGalleryEntry,
  writeGalleryPayload
} from "./gallery-entry-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryIndexFile = path.join(root, "gallery", "index.html");

const archiveArg = process.argv[2];
if (!archiveArg) {
  console.error("Usage: node scripts/update-gallery-entry.mjs <archive-id-or-path>");
  process.exit(1);
}

const archiveDir = resolveArchiveDir(archiveArg);
await assertReadable(archiveDir);

await runImageGenerator(archiveDir);

const entry = await buildArchiveEntry(archiveDir);
if (!entry) {
  console.error(`Archive is incomplete and cannot be added to the gallery: ${path.relative(root, archiveDir)}`);
  console.error("Expected at least critique.md; metadata.json and original.<ext> are recommended.");
  process.exit(1);
}

const payload = await readGalleryPayload();
const entries = upsertGalleryEntry(payload.entries, entry);
await writeGalleryPayload(entries);

const version = await updateGalleryAssetVersion();

console.log(`Updated ${path.relative(root, galleryDataFile)} with ${entry.id}.`);
console.log(`Gallery entry count: ${entries.length}.`);
console.log(`Gallery asset version: ${version}.`);

function resolveArchiveDir(arg) {
  const direct = path.resolve(arg);
  if (path.isAbsolute(arg) || arg.includes(path.sep)) return direct;
  return path.join(archiveRoot, arg);
}

async function assertReadable(dir) {
  try {
    await access(dir);
  } catch {
    console.error(`Archive directory not found: ${dir}`);
    process.exit(1);
  }
}

function runImageGenerator(archiveDir) {
  const script = path.join(__dirname, "generate-gallery-images.py");
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [script, archiveDir], {
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Image generator exited with code ${code}`));
    });
  });
}

async function updateGalleryAssetVersion() {
  const version = compactTimestamp(new Date());
  const html = await readFile(galleryIndexFile, "utf8");
  const updated = html
    .replace(/\.\/data\.js\?v=[^"]+/g, `./data.js?v=${version}`)
    .replace(/\.\/app\.js\?v=[^"]+/g, `./app.js?v=${version}`);

  if (updated !== html) await writeFile(galleryIndexFile, updated, "utf8");
  return version;
}

function compactTimestamp(date) {
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ];
  return parts.map((part) => String(part).padStart(2, "0")).join("");
}
