import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const photosRoot = path.join(root, "photos");

const photoDirs = (await readdir(photosRoot, { withFileTypes: true }).catch(() => []))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (!photoDirs.length) {
  console.error(`No photo directories found under ${path.relative(process.cwd(), photosRoot)}`);
  process.exit(1);
}

const summary = [];

for (const photoId of photoDirs) {
  const photoDir = path.join(photosRoot, photoId);
  const runsDir = path.join(photoDir, "runs");
  const runFiles = (await readdir(runsDir).catch(() => []))
    .filter((file) => /^run-\d+\.md$/.test(file))
    .sort((a, b) => runNumber(a) - runNumber(b));

  const runs = [];
  for (const file of runFiles) {
    const markdown = await readFile(path.join(runsDir, file), "utf8");
    runs.push({
      id: file.replace(/\.md$/, ""),
      file,
      scores: extractScores(markdown)
    });
  }

  const tags = await readJson(path.join(photoDir, "tags.json"));
  const analysis = {
    photoId,
    runCount: runs.length,
    scoreStability: analyzeScores(runs),
    textConsistency: tags ? analyzeTags(runs, tags) : { available: false, warning: "tags.json not found" }
  };

  await writeFile(path.join(photoDir, "analysis.json"), JSON.stringify(analysis, null, 2), "utf8");
  summary.push(analysis);
}

await writeFile(path.join(root, "summary", "analysis-summary.json"), JSON.stringify(summary, null, 2), "utf8");
console.log(`Analyzed ${summary.length} photo directories.`);

function runNumber(file) {
  return Number(/run-(\d+)\.md/.exec(file)?.[1] || 0);
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
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
  const patterns = [
    new RegExp(`(?:^|[|\\-\\s*])(?:${label})\\s*(?:[：:|])\\s*([0-9]+(?:\\.[0-9])?)\\s*(?:/\\s*10)?`, "m"),
    new RegExp(`(?:${label})[^0-9]{0,12}([0-9]+(?:\\.[0-9])?)\\s*(?:/\\s*10)?`, "m")
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(markdown);
    if (match) return Number(match[1]);
  }
  return null;
}

function analyzeScores(runs) {
  const dimensions = ["technical", "composition", "lighting", "story", "overall"];
  return Object.fromEntries(dimensions.map((dimension) => {
    const values = runs
      .map((run) => run.scores[dimension])
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    return [dimension, {
      count: values.length,
      values,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      range: values.length ? round(Math.max(...values) - Math.min(...values)) : null,
      mean: values.length ? round(mean(values)) : null,
      standardDeviation: values.length ? round(standardDeviation(values)) : null
    }];
  }));
}

function analyzeTags(runs, tags) {
  const runIds = runs.map((run) => run.id).filter((id) => tags[id]);
  const categoryFields = [
    "subject",
    "genre",
    "basicProblemTier",
    "capRule",
    "intentionalEffectJudgment",
    "highScoreEligible"
  ];

  return {
    available: true,
    codedRunCount: runIds.length,
    categoricalAgreement: Object.fromEntries(categoryFields.map((field) => [
      field,
      categoricalAgreement(runIds.map((id) => normalizeValue(tags[id]?.[field])))
    ])),
    issueTagJaccard: averagePairwiseJaccard(runIds.map((id) => tags[id]?.issueTags || [])),
    priorityTop3Overlap: averageTopOverlap(runIds.map((id) => tags[id]?.priorityIssueTags || []), 3),
    firstPriorityAgreement: categoricalAgreement(runIds.map((id) => normalizeValue(tags[id]?.priorityIssueTags?.[0]))),
    recommendationTagJaccard: averagePairwiseJaccard(runIds.map((id) => tags[id]?.recommendationTags || []))
  };
}

function categoricalAgreement(values) {
  const filtered = values.filter(Boolean);
  if (!filtered.length) return { count: 0, agreement: null, majorityValue: null, majorityCount: 0 };

  const counts = new Map();
  for (const value of filtered) counts.set(value, (counts.get(value) || 0) + 1);
  const [majorityValue, majorityCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    count: filtered.length,
    agreement: round(majorityCount / filtered.length),
    majorityValue,
    majorityCount
  };
}

function averagePairwiseJaccard(tagLists) {
  return averagePairs(tagLists, (left, right) => jaccard(left, right));
}

function averageTopOverlap(tagLists, topN) {
  return averagePairs(tagLists, (left, right) => {
    const a = new Set(left.slice(0, topN));
    const b = new Set(right.slice(0, topN));
    if (!a.size && !b.size) return 1;
    let overlap = 0;
    for (const value of a) if (b.has(value)) overlap += 1;
    return overlap / topN;
  });
}

function averagePairs(items, scorer) {
  const scores = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      scores.push(scorer(items[i] || [], items[j] || []));
    }
  }

  return {
    pairCount: scores.length,
    mean: scores.length ? round(mean(scores)) : null,
    min: scores.length ? round(Math.min(...scores)) : null,
    max: scores.length ? round(Math.max(...scores)) : null
  };
}

function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  if (!a.size && !b.size) return 1;

  const union = new Set([...a, ...b]);
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / union.size;
}

function normalizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
