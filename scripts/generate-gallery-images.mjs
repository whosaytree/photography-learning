import { access, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const archiveRoot = path.join(root, "data", "archive");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const variants = [
  { name: "thumb.jpg", maxSize: 480, quality: 72 },
  { name: "preview.jpg", maxSize: 1600, quality: 82 }
];

const archiveDirs = await readdir(archiveRoot, { withFileTypes: true }).catch(() => []);
let generated = 0;
let skipped = 0;
let missing = 0;

for (const dirent of archiveDirs) {
  if (!dirent.isDirectory()) continue;

  const dir = path.join(archiveRoot, dirent.name);
  const files = await readdir(dir).catch(() => []);
  const source = files.find((file) => /^original\./i.test(file) && imageExtensions.has(path.extname(file).toLowerCase()));

  if (!source) {
    missing += 1;
    continue;
  }

  const sourcePath = path.join(dir, source);
  const sourceStat = await stat(sourcePath);

  for (const variant of variants) {
    const outputPath = path.join(dir, variant.name);
    if (await isFresh(outputPath, sourceStat.mtimeMs)) {
      skipped += 1;
      continue;
    }

    await runSips(sourcePath, outputPath, variant);
    generated += 1;
  }
}

console.log(`Generated ${generated} gallery images. Skipped ${skipped}. Missing originals ${missing}.`);

async function isFresh(file, sourceMtimeMs) {
  try {
    await access(file, constants.R_OK);
    const outputStat = await stat(file);
    return outputStat.mtimeMs >= sourceMtimeMs;
  } catch {
    return false;
  }
}

function runSips(sourcePath, outputPath, variant) {
  const args = [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    String(variant.quality),
    "-Z",
    String(variant.maxSize),
    sourcePath,
    "--out",
    outputPath
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("sips", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`sips failed for ${path.relative(root, sourcePath)}: ${stderr.trim()}`));
    });
  });
}
