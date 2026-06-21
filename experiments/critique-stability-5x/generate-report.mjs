import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosRoot = path.join(__dirname, "photos");
const summaryRoot = path.join(__dirname, "summary");
const sourceSelection = await readJson(path.join(summaryRoot, "source-selection.json"), []);
const sourceByPhoto = new Map(sourceSelection.map((entry) => [entry.photoId, entry]));
const analyses = await readJson(path.join(summaryRoot, "analysis-summary.json"), []);

const rows = [];

for (const analysis of analyses) {
  const source = sourceByPhoto.get(analysis.photoId);
  const report = buildPhotoReport(analysis, source);
  await writeFile(path.join(photosRoot, analysis.photoId, "analysis.md"), report, "utf8");
  rows.push(buildSummaryRow(analysis, source));
}

await writeFile(path.join(summaryRoot, "score-stability.csv"), toCsv(rows.map((row) => ({
  photoId: row.photoId,
  bucket: row.bucket,
  overallValues: row.overallValues,
  overallMean: row.overallMean,
  overallRange: row.overallRange,
  overallSd: row.overallSd,
  largestDimensionRange: row.largestDimensionRange,
  largestDimension: row.largestDimension
}))), "utf8");

await writeFile(path.join(summaryRoot, "text-consistency.csv"), toCsv(rows.map((row) => ({
  photoId: row.photoId,
  bucket: row.bucket,
  basicAgreement: row.basicAgreement,
  capAgreement: row.capAgreement,
  highScoreAgreement: row.highScoreAgreement,
  issueJaccard: row.issueJaccard,
  top3Overlap: row.top3Overlap,
  firstPriorityAgreement: row.firstPriorityAgreement,
  recommendationJaccard: row.recommendationJaccard
}))), "utf8");

await writeFile(path.join(summaryRoot, "overall-analysis.md"), buildOverallReport(rows), "utf8");
console.log(`Generated reports for ${rows.length} photos.`);

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function buildSummaryRow(analysis, source = {}) {
  const score = analysis.scoreStability;
  const text = analysis.textConsistency;
  const ranges = Object.entries(score).map(([dimension, stat]) => ({
    dimension,
    range: stat.range ?? 0
  })).sort((a, b) => b.range - a.range);

  return {
    photoId: analysis.photoId,
    bucket: source.bucket || "",
    reason: source.reason || "",
    sourceTitle: source.sourceTitle || "",
    overallValues: score.overall.values.join("/"),
    overallMean: score.overall.mean,
    overallRange: score.overall.range,
    overallSd: score.overall.standardDeviation,
    largestDimension: ranges[0]?.dimension || "",
    largestDimensionRange: ranges[0]?.range ?? null,
    basicAgreement: text.categoricalAgreement.basicProblemTier.agreement,
    capAgreement: text.categoricalAgreement.capRule.agreement,
    highScoreAgreement: text.categoricalAgreement.highScoreEligible.agreement,
    issueJaccard: text.issueTagJaccard.mean,
    top3Overlap: text.priorityTop3Overlap.mean,
    firstPriorityAgreement: text.firstPriorityAgreement.agreement,
    recommendationJaccard: text.recommendationTagJaccard.mean,
    stability: classifyStability(score.overall.range, text)
  };
}

function buildPhotoReport(analysis, source = {}) {
  const row = buildSummaryRow(analysis, source);
  const score = analysis.scoreStability;
  const text = analysis.textConsistency;
  const lines = [];

  lines.push(`# ${analysis.photoId} 稳定性分析`);
  lines.push("");
  lines.push(`- 测试类型：${source.bucket || "未记录"}`);
  lines.push(`- 抽样理由：${source.reason || "未记录"}`);
  lines.push(`- 旧归档来源：${source.archiveId || "未记录"}`);
  lines.push(`- 结论等级：${row.stability}`);
  lines.push("");
  lines.push("## 分数波动");
  lines.push("");
  lines.push("| 维度 | 5 次分数 | 均值 | 极差 | 标准差 |");
  lines.push("| --- | --- | ---: | ---: | ---: |");
  for (const dimension of ["technical", "composition", "lighting", "story", "overall"]) {
    const stat = score[dimension];
    lines.push(`| ${dimensionName(dimension)} | ${stat.values.join(" / ")} | ${stat.mean} | ${stat.range} | ${stat.standardDeviation} |`);
  }
  lines.push("");
  lines.push("## 文字一致性");
  lines.push("");
  lines.push(`- 基础问题等级一致率：${percent(text.categoricalAgreement.basicProblemTier.agreement)}，多数判断：${text.categoricalAgreement.basicProblemTier.majorityValue}`);
  lines.push(`- 封顶规则一致率：${percent(text.categoricalAgreement.capRule.agreement)}，多数判断：${text.categoricalAgreement.capRule.majorityValue}`);
  lines.push(`- 高分资格一致率：${percent(text.categoricalAgreement.highScoreEligible.agreement)}，多数判断：${text.categoricalAgreement.highScoreEligible.majorityValue}`);
  lines.push(`- 问题标签平均 Jaccard：${text.issueTagJaccard.mean}`);
  lines.push(`- 前三优先问题平均重合率：${text.priorityTop3Overlap.mean}`);
  lines.push(`- 第一优先问题一致率：${percent(text.firstPriorityAgreement.agreement)}，多数第一问题：${text.firstPriorityAgreement.majorityValue}`);
  lines.push(`- 建议动作平均 Jaccard：${text.recommendationTagJaccard.mean}`);
  lines.push("");
  lines.push("## 解释");
  lines.push("");
  lines.push(explainPhoto(row));
  lines.push("");
  lines.push("备注：`subject` 和 `genre` 字段是自由文本，精确字符串一致率会低估语义一致性；本报告更看重基础问题等级、封顶规则、高分资格、问题标签和建议动作。");
  lines.push("");

  return lines.join("\n");
}

function buildOverallReport(rows) {
  const photoCount = rows.length;
  const runCount = rows.length * 5;
  const avgOverallRange = average(rows.map((row) => row.overallRange));
  const avgOverallSd = average(rows.map((row) => row.overallSd));
  const avgIssueJ = average(rows.map((row) => row.issueJaccard));
  const avgTop3 = average(rows.map((row) => row.top3Overlap));
  const avgRecJ = average(rows.map((row) => row.recommendationJaccard));
  const maxRange = rows.reduce((winner, row) => row.overallRange > winner.overallRange ? row : winner, rows[0]);
  const minText = rows.reduce((winner, row) => row.issueJaccard < winner.issueJaccard ? row : winner, rows[0]);
  const stableScoreRows = rows.filter((row) => row.overallRange <= 0.5);
  const driftRows = rows.filter((row) => row.stability === "明显漂移");
  const highStableRows = rows
    .filter((row) => row.stability === "高稳定")
    .map((row) => row.photoId);
  const driftIds = driftRows.map((row) => row.photoId);
  const boundaryDrifts = rows
    .filter((row) => row.overallRange > 1 || row.issueJaccard < 0.6)
    .map((row) => row.photoId);

  const lines = [];
  lines.push("# 摄影点评稳定性实验总体报告");
  lines.push("");
  lines.push("## 实验设置");
  lines.push("");
  lines.push(`- 测试集：从只读归档图片中复制出的 ${photoCount} 张隔离图片。`);
  lines.push(`- 重复次数：每张图片 5 次，共 ${runCount} 次独立点评。`);
  lines.push("- 独立性控制：每次点评由隔离子 agent 生成，只允许读取原图和规则文件，只写入自己的 `run-N.md`。");
  lines.push("- 文字一致性：先按 codebook 编码为 `tags.json`，再用公式计算，不直接凭主观印象下结论。");
  lines.push("");
  lines.push("## 总体结果");
  lines.push("");
  lines.push(`- 总体分平均极差：${round(avgOverallRange)}。`);
  lines.push(`- 总体分平均标准差：${round(avgOverallSd)}。`);
  lines.push(`- 问题标签平均 Jaccard：${round(avgIssueJ)}。`);
  lines.push(`- 前三优先问题平均重合率：${round(avgTop3)}。`);
  lines.push(`- 建议动作平均 Jaccard：${round(avgRecJ)}。`);
  lines.push(`- 总体分最不稳定图片：${maxRange.photoId}，极差 ${maxRange.overallRange}。`);
  lines.push(`- 问题标签一致性最低图片：${minText.photoId}，Jaccard ${minText.issueJaccard}。`);
  lines.push("");
  lines.push("## 明细表");
  lines.push("");
  lines.push("| 图片 | 类型 | 总体分 | 均值 | 极差 | SD | 问题 Jaccard | Top3 重合 | 建议 Jaccard | 等级 |");
  lines.push("| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const row of rows) {
    lines.push(`| ${row.photoId} | ${row.bucket} | ${row.overallValues} | ${row.overallMean} | ${row.overallRange} | ${row.overallSd} | ${row.issueJaccard} | ${row.top3Overlap} | ${row.recommendationJaccard} | ${row.stability} |`);
  }
  lines.push("");
  lines.push("## 主要发现");
  lines.push("");
  lines.push(`1. 分数稳定性仍强于文字细节稳定性。${photoCount} 张图中有 ${stableScoreRows.length} 张总体分极差不超过 0.5。`);
  lines.push(`2. 高稳定样本：${highStableRows.length ? highStableRows.map((id) => `\`${id}\``).join("、") : "无"}。这些图的分数和问题标签都较集中。`);
  lines.push(`3. 明显漂移样本：${driftIds.length ? driftIds.map((id) => `\`${id}\``).join("、") : "无"}。这些图应优先回看 run 文本。`);
  lines.push(`4. 总体分最不稳定的是 \`${maxRange.photoId}\`，总体分为 ${maxRange.overallValues}，极差 ${maxRange.overallRange}。`);
  lines.push(`5. 文字问题标签最不一致的是 \`${minText.photoId}\`，问题标签 Jaccard 为 ${minText.issueJaccard}。`);
  lines.push(`6. 需要重点复查的边界/规则漂移样本：${boundaryDrifts.length ? boundaryDrifts.map((id) => `\`${id}\``).join("、") : "无"}。`);
  lines.push("");
  lines.push("## 方法限制");
  lines.push("");
  lines.push("- `subject` 和 `genre` 是自由文本，精确字符串一致率会低估语义一致性。后续应在 codebook 中增加 `subjectTag` 和 `genreTag`。");
  lines.push("- 标签编码仍由模型完成，虽然最终指标由公式计算，但编码本身可能有少量主观差异。严谨版本可以让两名编码员独立编码后再仲裁。");
  lines.push(`- 当前测试集有 ${photoCount} 张图，已经能暴露主要漂移类型，但仍不足以代表所有题材和所有硬伤组合。`);
  lines.push("");
  lines.push("## 改进建议");
  lines.push("");
  lines.push("1. 在正式点评模板中强化“封顶规则先行”的输出约束，尤其是普通基础问题和逃逸规则。");
  lines.push("2. 把 `基础问题等级`、`封顶规则`、`高分资格` 改成更标准化的短标签，减少自由文本漂移。");
  lines.push("3. 对边界图增加专门判定句：先列出故意处理测试满足几条，再决定是否按硬伤处理。");
  lines.push("4. 扩充测试集到 20-30 张，并按题材和硬伤类型分层抽样。");
  lines.push("");

  return lines.join("\n");
}

function explainPhoto(row) {
  if (row.overallRange === 0 && row.issueJaccard >= 0.8) {
    return "分数和问题标签都高度稳定，重复点评基本落在同一判断框架内。";
  }
  if (row.overallRange <= 0.5 && row.issueJaccard >= 0.6) {
    return "总体分稳定，文字问题标签有少量漂移，但核心判断没有明显分裂。";
  }
  if (row.overallRange <= 1 && row.issueJaccard >= 0.5) {
    return "稳定性中等；最终分数仍在可接受范围内，但封顶、优先问题或建议动作存在明显分歧。";
  }
  return "存在明显漂移，需要回看 run 文本，判断是评分规则不清还是标签编码不稳。";
}

function classifyStability(overallRange, text) {
  const keyAgreement = Math.min(
    text.categoricalAgreement.basicProblemTier.agreement ?? 0,
    text.categoricalAgreement.highScoreEligible.agreement ?? 0
  );
  const issueJ = text.issueTagJaccard.mean ?? 0;

  if (overallRange <= 0.5 && keyAgreement >= 0.8 && issueJ >= 0.7) return "高稳定";
  if (overallRange <= 1 && keyAgreement >= 0.6 && issueJ >= 0.5) return "中等稳定";
  return "明显漂移";
}

function dimensionName(dimension) {
  return {
    technical: "技术",
    composition: "构图",
    lighting: "光线",
    story: "叙事",
    overall: "总体"
  }[dimension] || dimension;
}

function percent(value) {
  return value === null || value === undefined ? "N/A" : `${Math.round(value * 100)}%`;
}

function average(values) {
  const filtered = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }
  return lines.join("\n") + "\n";
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
