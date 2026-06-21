import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const experimentRoot = __dirname;
const projectRoot = path.resolve(experimentRoot, "..", "..");
const archiveRoot = path.join(projectRoot, "data", "archive");
const photosRoot = path.join(experimentRoot, "photos");
const summaryRoot = path.join(experimentRoot, "summary");

const selected = [
  {
    photoId: "photo-01",
    archiveId: "20260604-212802-eef342f2",
    bucket: "strong_high_score",
    reason: "High-scoring architecture image; tests whether strong images consistently pass high-score eligibility."
  },
  {
    photoId: "photo-02",
    archiveId: "20260608-170809-8225400a",
    bucket: "ordinary_record",
    reason: "Mid-score record-like building image; tests whether the 5/10 baseline stays stable."
  },
  {
    photoId: "photo-03",
    archiveId: "20260609-153041-44eac2d4",
    bucket: "hard_flaw_low_score",
    reason: "Low-scoring image with prior hard-flaw behavior; tests cap and low-end consistency."
  },
  {
    photoId: "photo-04",
    archiveId: "20260604-f10f7388",
    bucket: "orientation_or_basic_failure",
    reason: "Static-life image with prior orientation/basic-problem behavior; tests basic-problem tier consistency."
  },
  {
    photoId: "photo-05",
    archiveId: "20260608-165815-bbc39e31",
    bucket: "intent_boundary",
    reason: "Silhouette/darkness boundary case; tests intentional-effect vs accidental-flaw consistency."
  },
  {
    photoId: "photo-06",
    archiveId: "20260604-135047-7cd48bcf",
    bucket: "night_street_light",
    reason: "Night street scene with strong light/color; tests stability on atmospheric low-light scenes."
  },
  {
    photoId: "photo-07",
    archiveId: "20260604-214217-dusk-street-market",
    bucket: "strong_night_street",
    reason: "High-scoring dusk street-market image; tests whether strong street atmosphere remains consistently high."
  },
  {
    photoId: "photo-08",
    archiveId: "20260604-132642-87888d3c",
    bucket: "strong_landscape",
    reason: "High-scoring landscape; tests stability on natural scenery with atmosphere."
  },
  {
    photoId: "photo-09",
    archiveId: "20260604-047a29d3",
    bucket: "strong_garden_composition",
    reason: "High-scoring garden/bridge composition; tests stability on layered composition and controlled scenery."
  },
  {
    photoId: "photo-10",
    archiveId: "20260604-133429-f47c12fc",
    bucket: "missed_focus_low_score",
    reason: "Low-scoring out-of-focus foliage image; tests focus hard-flaw cap consistency."
  },
  {
    photoId: "photo-11",
    archiveId: "20260609-1103-19645aef",
    bucket: "ordinary_signage_record",
    reason: "Low-scoring signage/record image; tests ordinary-documentation and subject-control consistency."
  },
  {
    photoId: "photo-12",
    archiveId: "20260604-215739-phone-game-screen",
    bucket: "screen_record_hard_flaw",
    reason: "Phone-screen record image; tests scoring on non-photographic/documentary screen capture."
  },
  {
    photoId: "photo-13",
    archiveId: "20260604-215130-overhead-cat-yard",
    bucket: "animal_subject_weak",
    reason: "Overhead animal photo with weak subject control; tests subject readability and crop consistency."
  },
  {
    photoId: "photo-14",
    archiveId: "20260609-105810-44ef555e",
    bucket: "ordinary_window_view",
    reason: "Window-view community/building record; tests consistency around record-level urban scenes."
  },
  {
    photoId: "photo-15",
    archiveId: "20260604-211358-mosque-arcade-water",
    bucket: "orientation_architecture",
    reason: "Architecture/water scene with prior orientation issue; tests whether orientation and composition caps are stable."
  },
  {
    photoId: "photo-16",
    archiveId: "20260604-70ecf563",
    bucket: "orientation_still_life",
    reason: "Low-scoring still life with prior orientation issue; tests repeated diagnosis of rotation/basic failure."
  },
  {
    photoId: "photo-17",
    archiveId: "20260609-1051-0e9dfe09",
    bucket: "low_light_technical_failure",
    reason: "Low-scoring night river scene with technical limitations; tests low-light hard-flaw consistency."
  },
  {
    photoId: "photo-18",
    archiveId: "20260609-104329-5d59f884",
    bucket: "silhouette_intent_boundary",
    reason: "Window-framed sunset silhouette; tests intentional silhouette vs exposure-loss consistency."
  },
  {
    photoId: "photo-19",
    archiveId: "20260609-103946-5494dad4",
    bucket: "food_record_mid_score",
    reason: "Food/table close-up at mid score; tests everyday still-life scoring and advice consistency."
  },
  {
    photoId: "photo-20",
    archiveId: "20260604-220423-01685d88",
    bucket: "animal_record_mid_score",
    reason: "Animal record photo at mid score; tests subject interest versus technical/composition limitations."
  }
];

await mkdir(photosRoot, { recursive: true });
await mkdir(summaryRoot, { recursive: true });

const manifest = [];

for (const item of selected) {
  const archiveDir = path.join(archiveRoot, item.archiveId);
  const files = await readdir(archiveDir);
  const imageFile = files.find((file) => /^original\.(jpg|jpeg|png|webp)$/i.test(file));
  if (!imageFile) throw new Error(`No original image found for ${item.archiveId}`);

  const metadata = await readJson(path.join(archiveDir, "metadata.json"));
  const critique = await readFile(path.join(archiveDir, "critique.md"), "utf8");
  const extension = path.extname(imageFile).toLowerCase() || ".jpg";
  const photoDir = path.join(photosRoot, item.photoId);
  const runsDir = path.join(photoDir, "runs");
  const targetImage = `original${extension}`;

  await mkdir(runsDir, { recursive: true });
  await copyFile(path.join(archiveDir, imageFile), path.join(photoDir, targetImage));
  await writeFile(path.join(photoDir, "prompt.md"), buildPrompt(item.photoId, targetImage), "utf8");

  manifest.push({
    photoId: item.photoId,
    archiveId: item.archiveId,
    bucket: item.bucket,
    reason: item.reason,
    copiedImage: `photos/${item.photoId}/${targetImage}`,
    sourceTitle: metadata?.title || item.archiveId,
    sourceScores: extractScores(critique)
  });
}

await writeFile(path.join(summaryRoot, "source-selection.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Prepared ${manifest.length} isolated test photos under ${path.relative(projectRoot, photosRoot)}.`);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function buildPrompt(photoId, targetImage) {
  const imagePath = path.join(photosRoot, photoId, targetImage);
  return `# ${photoId} 独立点评任务

你正在执行摄影点评稳定性实验中的一次独立 run。

约束：
- 不读取同一照片的其他 run 输出。
- 不读取本目录 runs/ 下除本次 output_path 外的文件。
- 不读取 data/archive/ 下的旧点评、旧 metadata 或旧标题。
- 不写入 data/archive/。
- 必须读取并遵守 /Users/bytedance/Documents/摄影学习/AGENTS.md。
- 必须读取并遵守 /Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md。
- 必须读取并遵守 /Users/bytedance/Documents/摄影学习/SCORING_RUBRIC.md。

输入图片：
${imagePath}

请完整生成一次中文摄影点评，包含 AGENTS.md 要求的全部栏目。
`;
}

function extractScores(markdown) {
  return {
    technical: extractScore(markdown, "技术"),
    composition: extractScore(markdown, "构图"),
    lighting: extractScore(markdown, "光线"),
    story: extractScore(markdown, "叙事"),
    overall: extractScore(markdown, "总体|整体")
  };
}

function extractScore(markdown, label) {
  const pattern = new RegExp(`(?:^|[|\\-\\s*])(?:${label})\\s*(?:[：:|])\\s*([0-9]+(?:\\.[0-9])?)`, "m");
  const match = pattern.exec(markdown);
  return match ? Number(match[1]) : null;
}
