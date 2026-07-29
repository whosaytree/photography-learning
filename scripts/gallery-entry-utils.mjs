import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const root = path.resolve(__dirname, "..");
export const archiveRoot = path.join(root, "data", "archive");
export const galleryDir = path.join(root, "gallery");
export const galleryDataFile = path.join(galleryDir, "data.js");

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const generatedImageNames = new Set(["thumb.jpg", "preview.jpg"]);

export async function buildArchiveEntry(archiveDir) {
  const dir = path.resolve(archiveDir);
  const id = path.basename(dir);
  const metadata = await readJson(path.join(dir, "metadata.json"));
  const critique = await readText(path.join(dir, "critique.md"));
  if (!critique) return null;

  const files = await readdir(dir).catch(() => []);
  const imageFile = findArchiveImage(files, metadata);
  const thumbFile = files.includes("thumb.jpg") ? "thumb.jpg" : "";
  const previewFile = files.includes("preview.jpg") ? "preview.jpg" : "";
  const createdAt = metadata?.created_at || metadata?.createdAt || inferDateFromId(id);

  return {
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
  };
}

export async function readGalleryPayload() {
  try {
    const source = await readFile(galleryDataFile, "utf8");
    const match = /window\.ARCHIVE_GALLERY\s*=\s*([\s\S]*);\s*$/.exec(source.trim());
    if (!match) return { generatedAt: "", count: 0, entries: [] };
    const payload = JSON.parse(match[1]);
    return {
      generatedAt: payload.generatedAt || "",
      count: Number(payload.count) || 0,
      entries: Array.isArray(payload.entries) ? payload.entries : []
    };
  } catch {
    return { generatedAt: "", count: 0, entries: [] };
  }
}

export async function writeGalleryPayload(entries, generatedAt = new Date().toISOString()) {
  await mkdir(galleryDir, { recursive: true });
  const sortedEntries = sortEntries(entries);
  const payload = `window.ARCHIVE_GALLERY = ${JSON.stringify(
    {
      generatedAt,
      count: sortedEntries.length,
      entries: sortedEntries
    },
    null,
    2
  )};\n`;

  await writeFile(galleryDataFile, payload, "utf8");
}

export function upsertGalleryEntry(entries, entry) {
  return sortEntries([entry, ...entries.filter((existing) => existing.id !== entry.id)]);
}

export function sortEntries(entries) {
  return [...entries].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export async function readText(file) {
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
  const inlineMatch = /^#{0,6}\s*一句话总评\s*[：:]\s*(.+)$/m.exec(markdown);
  if (inlineMatch?.[1]) return normalizeSummary(inlineMatch[1]);

  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+一句话总评\s*$/.test(line.trim()));
  if (headingIndex === -1) return "";

  const sectionLines = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (/^#{1,6}\s+/.test(line.trim())) break;
    sectionLines.push(line);
  }

  return normalizeSummary(sectionLines.join("\n"));
}

function normalizeSummary(value) {
  return value
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim()
    .replace(/\s+/g, " ");
}

function extractScores(markdown) {
  const scoreSource = extractScoreSection(markdown) || markdown;
  const fields = {
    technical: scorePattern("技术"),
    composition: scorePattern("构图"),
    lighting: scorePattern("光线"),
    story: scorePattern("叙事"),
    overall: scorePattern("总体|整体")
  };

  return Object.fromEntries(
    Object.entries(fields).map(([key, regex]) => {
      const match = regex.exec(scoreSource);
      return [key, match ? Number(match[1]) : null];
    })
  );
}

function mergeScores(primary, fallback = {}) {
  return Object.fromEntries(
    Object.entries(primary).map(([key, value]) => [
      key,
      value ?? getFallbackScore(fallback, key)
    ])
  );
}

function extractScoreSection(markdown) {
  const normalized = markdown
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1");

  const lines = normalized.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+五项评分\s*$/.test(line.trim()));
  if (headingIndex === -1) return normalized;

  const sectionLines = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (/^#{1,6}\s+/.test(line.trim())) break;
    sectionLines.push(line);
  }

  return sectionLines.join("\n");
}

function getFallbackScore(fallback, key) {
  if (!fallback || typeof fallback !== "object") return null;

  const aliases = {
    lighting: ["lighting", "light"],
    overall: ["overall", "total"],
    technical: ["technical"],
    composition: ["composition"],
    story: ["story"]
  }[key] || [key];

  for (const alias of aliases) {
    const value = fallback[alias];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function scorePattern(label) {
  return new RegExp(`(?:^|[|\\-\\s])(?:${label})(?:评分|分)?\\s*(?:[：:|])\\s*([0-9]+(?:\\.[0-9])?)(?:\\s*\\/\\s*10)?`, "m");
}
