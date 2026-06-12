import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const archiveRoot = path.join(root, "data", "archive");
const galleryDir = path.join(root, "gallery");
const outputFile = path.join(galleryDir, "data.js");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const generatedImageNames = new Set(["thumb.jpg", "preview.jpg"]);

await mkdir(galleryDir, { recursive: true });

const entries = [];
const archiveDirs = await readdir(archiveRoot, { withFileTypes: true }).catch(() => []);

for (const dirent of archiveDirs) {
  if (!dirent.isDirectory()) continue;

  const id = dirent.name;
  const dir = path.join(archiveRoot, id);
  const metadata = await readJson(path.join(dir, "metadata.json"));
  const critique = await readText(path.join(dir, "critique.md"));
  if (!critique) continue;

  const files = await readdir(dir).catch(() => []);
  const imageFile = findArchiveImage(files, metadata);
  const thumbFile = files.includes("thumb.jpg") ? "thumb.jpg" : "";
  const previewFile = files.includes("preview.jpg") ? "preview.jpg" : "";

  const createdAt = metadata?.created_at || metadata?.createdAt || inferDateFromId(id);

  entries.push({
    id,
    title: metadata?.title || extractTitle(critique) || id,
    createdAt,
    dateKey: createdAt.slice(0, 10),
    imageSrc: imageFile ? archiveUrl(id, imageFile) : "",
    thumbSrc: thumbFile ? archiveUrl(id, thumbFile) : imageFile ? archiveUrl(id, imageFile) : "",
    previewSrc: previewFile ? archiveUrl(id, previewFile) : imageFile ? archiveUrl(id, imageFile) : "",
    imageFile: imageFile || "",
    dimensions: metadata?.image_dimensions || null,
    imageSaved: Boolean(imageFile),
    summary: extractSummary(critique),
    scores: mergeScores(extractScores(critique), metadata?.scores),
    critique
  });
}

entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const payload = `window.ARCHIVE_GALLERY = ${JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries
  },
  null,
  2
)};\n`;

await writeFile(outputFile, payload, "utf8");
console.log(`Generated ${path.relative(root, outputFile)} with ${entries.length} entries.`);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function readText(file) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return "";
  }
}

function findArchiveImage(files, metadata) {
  const configuredImage = metadata?.saved_image || metadata?.image_file;
  if (configuredImage && files.includes(configuredImage)) return configuredImage;

  const original = files.find((file) => /^original\./i.test(file) && imageExtensions.has(path.extname(file).toLowerCase()));
  if (original) return original;

  return files.find((file) => {
    const lower = file.toLowerCase();
    return imageExtensions.has(path.extname(lower)) && !generatedImageNames.has(lower);
  });
}

function archiveUrl(id, file) {
  return `../data/archive/${id}/${file}`;
}

function inferDateFromId(id) {
  const compact = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(id);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}+08:00`;

  const dayOnly = /^(\d{4})(\d{2})(\d{2})/.exec(id);
  if (dayOnly) return `${dayOnly[1]}-${dayOnly[2]}-${dayOnly[3]}T00:00:00+08:00`;

  return "1970-01-01T00:00:00+08:00";
}

function extractTitle(markdown) {
  const match = /^#\s+(.+)$/m.exec(markdown);
  return match?.[1]?.trim();
}

function extractSummary(markdown) {
  const match = /##\s+一句话总评\s+([\s\S]*?)(?=\n##\s+|$)/.exec(markdown);
  return match?.[1]?.trim().replace(/\s+/g, " ") || "";
}

function extractScores(markdown) {
  const fields = {
    technical: scorePattern("技术"),
    composition: scorePattern("构图"),
    lighting: scorePattern("光线"),
    story: scorePattern("叙事"),
    overall: scorePattern("总体|整体")
  };

  return Object.fromEntries(
    Object.entries(fields).map(([key, regex]) => {
      const match = regex.exec(markdown);
      return [key, match ? Number(match[1]) : null];
    })
  );
}

function mergeScores(primary, fallback = {}) {
  return Object.fromEntries(
    Object.entries(primary).map(([key, value]) => [
      key,
      value ?? (typeof fallback?.[key] === "number" ? fallback[key] : null)
    ])
  );
}

function scorePattern(label) {
  return new RegExp(`(?:^|[|\\-\\s])(?:${label})\\s*(?:[：:|])\\s*([0-9.]+)(?:\\s*\\/\\s*10)?`, "m");
}
