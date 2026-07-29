import { readdir } from "node:fs/promises";
import path from "node:path";
import { archiveRoot, buildArchiveEntry, galleryDataFile, root, writeGalleryPayload } from "./gallery-entry-utils.mjs";

const entries = [];
const archiveDirs = await readdir(archiveRoot, { withFileTypes: true }).catch(() => []);

for (const dirent of archiveDirs) {
  if (!dirent.isDirectory()) continue;

  const entry = await buildArchiveEntry(path.join(archiveRoot, dirent.name));
  if (entry) entries.push(entry);
}

await writeGalleryPayload(entries);
console.log(`Generated ${path.relative(root, galleryDataFile)} with ${entries.length} entries.`);
