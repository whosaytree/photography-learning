import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const archiveRoot = path.join(root, "data", "archive");
const indexFile = path.join(archiveRoot, "index.json");

const args = parseArgs(process.argv.slice(2));
const critique = await readStdin();
if (!critique.trim()) {
  console.error("No critique content received on stdin.");
  process.exit(1);
}

await mkdir(archiveRoot, { recursive: true });

const createdAt = new Date().toISOString();
const id = `${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto.randomBytes(3).toString("hex")}`;
const dir = path.join(archiveRoot, id);
await mkdir(dir, { recursive: true });

let imageFile = null;
if (args.image) {
  const source = path.resolve(args.image);
  const extension = path.extname(source) || ".jpg";
  imageFile = `original${extension.toLowerCase()}`;
  await copyFile(source, path.join(dir, imageFile));
}

const metadata = {
  id,
  created_at: createdAt,
  title: args.title || "摄影点评",
  image_source: args.image ? path.resolve(args.image) : "chat_attachment",
  image_file_saved: Boolean(imageFile),
  image_file: imageFile
};

await writeFile(path.join(dir, "critique.md"), critique.trimEnd() + "\n", "utf8");
await writeFile(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

const index = await readIndex();
index.unshift(metadata);
await writeFile(indexFile, JSON.stringify(index, null, 2), "utf8");

console.log(path.relative(root, dir));

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--title") parsed.title = argv[++index];
    if (arg === "--image") parsed.image = argv[++index];
  }
  return parsed;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function readIndex() {
  try {
    return JSON.parse(await readFile(indexFile, "utf8"));
  } catch {
    return [];
  }
}
