const data = window.ARCHIVE_GALLERY || { entries: [] };
const entries = data.entries || [];
const SESSION_KEY = "photography-score-session-v1";
const SCORE_ITEMS = [
  ["technical", "技术"],
  ["composition", "构图"],
  ["lighting", "光线"],
  ["story", "叙事"],
  ["overall", "总体"]
];

const els = {
  stats: document.querySelector("#stats"),
  modeTabs: document.querySelectorAll("[data-mode]"),
  singleMode: document.querySelector("#singleMode"),
  compareMode: document.querySelector("#compareMode"),
  guideMode: document.querySelector("#guideMode"),
  overviewMode: document.querySelector("#overviewMode"),
  overviewMeta: document.querySelector("#overviewMeta"),
  overviewGrid: document.querySelector("#overviewGrid"),
  comparePhotos: document.querySelector("#comparePhotos"),
  compareControls: document.querySelector("#compareControls"),
  compareCount: document.querySelector("#compareCount"),
  dateCount: document.querySelector("#dateCount"),
  dateList: document.querySelector("#dateList"),
  activeDateTitle: document.querySelector("#activeDateTitle"),
  photoCount: document.querySelector("#photoCount"),
  thumbList: document.querySelector("#thumbList"),
  mainImage: document.querySelector("#mainImage"),
  emptyState: document.querySelector("#emptyState"),
  critique: document.querySelector("#critique"),
  startSession: document.querySelector("#startSession"),
  endSession: document.querySelector("#endSession"),
  sessionStatus: document.querySelector("#sessionStatus")
};

const state = {
  mode: "single",
  dateKey: "",
  entryId: "",
  comparePair: null,
  session: loadSession()
};

const groups = groupByDate(entries);
const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

init();

function init() {
  els.stats.textContent = `${entries.length} 张照片 · ${dateKeys.length} 天`;
  els.dateCount.textContent = String(dateKeys.length);
  if (state.session.active && state.session.mode) state.mode = state.session.mode;
  if (state.session.active && state.session.mode === "compare") state.comparePair = state.session.comparePair || null;

  if (!entries.length) {
    renderEmpty("还没有归档。");
    return;
  }

  state.dateKey = dateKeys[0];
  state.entryId = groups[state.dateKey][0]?.id || "";
  renderDates();
  renderThumbs();
  renderViewer();
  renderMode();
  renderCompare();
  renderOverview();
  renderSessionControls();
}

function groupByDate(items) {
  return items.reduce((acc, entry) => {
    const key = entry.dateKey || "未标日期";
    acc[key] ||= [];
    acc[key].push(entry);
    return acc;
  }, {});
}

function setMode(mode) {
  if (mode === state.mode) return;
  if (state.session.active && isScoringMode(mode) && mode !== state.session.mode) {
    renderSessionControls(`请先结束当前${getModeLabel(state.session.mode)}评分`);
    return;
  }

  state.mode = mode;
  renderMode();
  renderCompare();
  renderSessionControls();
}

function renderMode() {
  els.modeTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  els.singleMode.classList.toggle("active", state.mode === "single");
  els.compareMode.classList.toggle("active", state.mode === "compare");
  els.guideMode.classList.toggle("active", state.mode === "guide");
  els.overviewMode.classList.toggle("active", state.mode === "overview");
}

function renderDates() {
  els.dateList.innerHTML = dateKeys
    .map((key) => {
      const active = key === state.dateKey ? " active" : "";
      return `
        <button class="date-button${active}" type="button" data-date="${escapeHtml(key)}">
          <span>${escapeHtml(formatDate(key))}</span>
          <small>${groups[key].length}</small>
        </button>
      `;
    })
    .join("");
}

function renderThumbs() {
  const items = groups[state.dateKey] || [];
  els.activeDateTitle.textContent = formatDate(state.dateKey);
  els.photoCount.textContent = String(items.length);
  els.thumbList.innerHTML = items
    .map((entry) => {
      const active = entry.id === state.entryId ? " active" : "";
      const score = entry.scores?.overall == null ? "-" : entry.scores.overall;
      return `
        <button class="thumb-button${active}" type="button" data-id="${escapeHtml(entry.id)}">
          <span class="thumb">
            ${
              entry.imageSrc
                ? `<img src="${escapeHtml(getImageSrc(entry, "thumb"))}" data-fallback-src="${escapeHtml(
                    getFallbackImageSrc(entry, "thumb")
                  )}" alt="" loading="lazy" decoding="async" />`
                : ""
            }
          </span>
          <span>
            <span class="thumb-title">${escapeHtml(entry.title)}</span>
            <span class="thumb-meta">${escapeHtml(formatTime(entry.createdAt))}<br />总体 ${escapeHtml(score)}/10</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderViewer() {
  const entry = entries.find((item) => item.id === state.entryId);
  if (!entry) {
    renderEmpty("没有选择照片。");
    return;
  }

  if (entry.imageSrc) {
    els.mainImage.hidden = false;
    els.emptyState.hidden = true;
    els.mainImage.src = getImageSrc(entry, "preview");
    els.mainImage.dataset.fallbackSrc = getFallbackImageSrc(entry, "preview");
  } else {
    els.mainImage.hidden = true;
    els.emptyState.hidden = false;
    els.emptyState.textContent = "这条归档没有可显示的原图";
    els.mainImage.removeAttribute("data-fallback-src");
  }

  els.critique.innerHTML = renderCritique(entry);
}

function renderCritique(entry) {
  const scoreHtml = renderScores(entry);
  const markdownHtml = renderMarkdown(entry.critique || "");
  return `
    <h2>${escapeHtml(entry.title)}</h2>
    <p class="lead">${escapeHtml(entry.summary || "没有提取到一句话总评。")}</p>
    ${scoreHtml}
    ${markdownHtml}
  `;
}

function renderScores(entry) {
  const scores = entry.scores || {};
  const entryFeedback = state.session.selections?.[entry.id] || {};
  const entryNote = state.session.notes?.[entry.id]?.note || "";
  const disabled = state.session.active && state.session.mode === "single" ? "" : " disabled";

  return `
    <div class="score-row">
      ${SCORE_ITEMS
        .map(
          ([key, label]) => {
            const value = scores[key];
            const active = entryFeedback[key] || "";
            return `
          <div class="score">
            <span>${label}</span>
            <div class="score-value">
              <strong>${value == null ? "-" : escapeHtml(value)}</strong>
              <div class="feedback-buttons" aria-label="${label}评分反馈">
                <button
                  class="feedback-button${active === "low" ? " active" : ""}"
                  type="button"
                  data-score-feedback="low"
                  data-score-key="${key}"
                  data-entry-id="${escapeHtml(entry.id)}"
                  title="这个分数偏低，可以更高"
                  aria-label="${label}分数偏低，可以更高"
                  ${disabled}
                >↑</button>
                <button
                  class="feedback-button${active === "high" ? " active" : ""}"
                  type="button"
                  data-score-feedback="high"
                  data-score-key="${key}"
                  data-entry-id="${escapeHtml(entry.id)}"
                  title="这个分数偏高，可以更低"
                  aria-label="${label}分数偏高，可以更低"
                  ${disabled}
                >↓</button>
              </div>
            </div>
          </div>
        `;
          }
        )
        .join("")}
    </div>
    <label class="score-note">
      <span>评分反馈</span>
      <textarea
        data-score-note
        data-entry-id="${escapeHtml(entry.id)}"
        rows="3"
        placeholder="写下你对这张照片评分或点评的看法"
        ${disabled}
      >${escapeHtml(entryNote)}</textarea>
    </label>
  `;
}

function setNextComparePair() {
  const candidates = entries.filter((entry) => entry.imageSrc);
  if (candidates.length < 2) {
    state.comparePair = null;
    return;
  }

  const leftIndex = Math.floor(Math.random() * candidates.length);
  let rightIndex = Math.floor(Math.random() * candidates.length);
  while (rightIndex === leftIndex) rightIndex = Math.floor(Math.random() * candidates.length);

  const left = candidates[leftIndex];
  const right = candidates[rightIndex];
  const pairId = `${left.id}__${right.id}__${Date.now()}`;
  state.comparePair = { pairId, left, right };
  state.session.comparePair = state.comparePair;
  saveSession();
}

function renderCompare() {
  if (!els.comparePhotos || !els.compareControls) return;

  const isActiveCompare = state.session.active && state.session.mode === "compare";
  const pair = state.comparePair || state.session.comparePair;
  if (!pair) {
    els.compareCount.textContent = "0";
    els.comparePhotos.innerHTML = '<div class="compare-empty">点击左下角“开始评分”后随机抽取两张照片。</div>';
    els.compareControls.innerHTML = "";
    return;
  }

  state.comparePair = pair;
  els.compareCount.textContent = String(SCORE_ITEMS.length);
  els.comparePhotos.innerHTML = `
    ${renderComparePhoto("left", "左图", pair.left)}
    ${renderComparePhoto("right", "右图", pair.right)}
  `;

  const pairSelections = state.session.compareSelections?.[pair.pairId] || {};
  els.compareControls.innerHTML = `
    <div class="compare-help">选择每个维度里哪张照片更高。</div>
    ${SCORE_ITEMS.map(([key, label]) => renderCompareRow(pair, pairSelections, key, label, !isActiveCompare)).join("")}
    <button class="next-pair-button" type="button" data-next-pair ${isActiveCompare ? "" : "disabled"}>
      换一组
    </button>
  `;
}

function renderComparePhoto(side, label, entry) {
  return `
    <article class="compare-photo ${side}">
      <div class="compare-image">
        <img src="${escapeHtml(getImageSrc(entry, "preview"))}" data-fallback-src="${escapeHtml(
          getFallbackImageSrc(entry, "preview")
        )}" alt="${escapeHtml(label)}：${escapeHtml(entry.title)}" loading="lazy" decoding="async" />
      </div>
      <div class="compare-caption">
        <strong>${label}</strong>
        <span>${escapeHtml(entry.title)}</span>
        <small>${escapeHtml(entry.id)}</small>
      </div>
    </article>
  `;
}

function renderCompareRow(pair, pairSelections, scoreKey, scoreLabel, disabled) {
  const activeSide = pairSelections[scoreKey] || "";
  return `
    <div class="compare-row">
      <span class="compare-dimension">${escapeHtml(scoreLabel)}</span>
      <div class="compare-choice-group">
        <button
          class="compare-choice${activeSide === "left" ? " active" : ""}"
          type="button"
          data-compare-choice="left"
          data-score-key="${scoreKey}"
          data-pair-id="${escapeHtml(pair.pairId)}"
          ${disabled ? "disabled" : ""}
        >左图更高</button>
        <button
          class="compare-choice${activeSide === "right" ? " active" : ""}"
          type="button"
          data-compare-choice="right"
          data-score-key="${scoreKey}"
          data-pair-id="${escapeHtml(pair.pairId)}"
          ${disabled ? "disabled" : ""}
        >右图更高</button>
        <button
          class="compare-choice${activeSide === "tie" ? " active" : ""}"
          type="button"
          data-compare-choice="tie"
          data-score-key="${scoreKey}"
          data-pair-id="${escapeHtml(pair.pairId)}"
          ${disabled ? "disabled" : ""}
        >难说</button>
      </div>
    </div>
  `;
}

function updateCompareChoice(pairId, scoreKey, side) {
  if (!state.session.active || state.session.mode !== "compare") {
    renderSessionControls("请先在对比模式点击“开始评分”");
    return;
  }

  const pair = state.comparePair || state.session.comparePair;
  if (!pair || pair.pairId !== pairId) return;

  state.session.compareSelections ||= {};
  state.session.compareSelections[pairId] ||= {};
  const previousValue = state.session.compareSelections[pairId][scoreKey] || null;
  const resultingValue = previousValue === side ? null : side;

  if (resultingValue) {
    state.session.compareSelections[pairId][scoreKey] = resultingValue;
  } else {
    delete state.session.compareSelections[pairId][scoreKey];
  }

  if (!Object.keys(state.session.compareSelections[pairId]).length) {
    delete state.session.compareSelections[pairId];
  }

  const selectedEntry = resultingValue === "right" ? pair.right : pair.left;
  const lowerEntry = resultingValue === "right" ? pair.left : pair.right;
  state.session.actions.push({
    index: state.session.actions.length + 1,
    timestamp: new Date().toISOString(),
    mode: "compare",
    pairId,
    scoreKey,
    scoreLabel: getScoreLabel(scoreKey),
    leftEntry: summarizeEntry(pair.left),
    rightEntry: summarizeEntry(pair.right),
    clickedSide: side,
    previousValue,
    resultingValue,
    selectedHigherEntryId: resultingValue && resultingValue !== "tie" ? selectedEntry.id : null,
    selectedLowerEntryId: resultingValue && resultingValue !== "tie" ? lowerEntry.id : null,
    isTieOrUnclear: resultingValue === "tie",
    action: resultingValue ? "set" : "clear"
  });

  state.session.updatedAt = new Date().toISOString();
  saveSession();
  renderSessionControls();
  renderCompare();
}

function summarizeEntry(entry) {
  return {
    id: entry.id,
    title: entry.title,
    createdAt: entry.createdAt
  };
}

function getImageSrc(entry, usage) {
  if (usage === "thumb") return entry.thumbSrc || entry.previewSrc || entry.imageSrc || "";
  if (usage === "preview") return entry.previewSrc || entry.thumbSrc || entry.imageSrc || "";
  return entry.imageSrc || entry.previewSrc || entry.thumbSrc || "";
}

function getFallbackImageSrc(entry, usage) {
  const current = getImageSrc(entry, usage);
  const fallback = usage === "thumb" ? entry.previewSrc || entry.imageSrc || "" : entry.imageSrc || "";
  return fallback && fallback !== current ? fallback : "";
}

function handleImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;

  const fallbackSrc = image.dataset.fallbackSrc || "";
  if (!fallbackSrc) return;

  image.dataset.fallbackSrc = "";
  image.src = fallbackSrc;
}

function renderOverview() {
  if (!els.overviewGrid || !els.overviewMeta) return;

  const distributions = SCORE_ITEMS.map(([key, label]) => buildScoreDistribution(key, label));
  els.overviewMeta.textContent = `${entries.length} 张照片 · ${data.generatedAt ? `数据生成 ${formatDateTime(data.generatedAt)}` : "当前数据"}`;
  els.overviewGrid.innerHTML = distributions.map(renderDistributionPanel).join("");
}

function buildScoreDistribution(scoreKey, scoreLabel) {
  const values = entries
    .map((entry) => Number(entry.scores?.[scoreKey]))
    .filter((value) => Number.isFinite(value));
  const buckets = Array.from({ length: 10 }, (_, index) => ({
    score: index + 1,
    count: 0
  }));

  for (const value of values) {
    const bucketIndex = Math.max(0, Math.min(9, Math.floor(value) - 1));
    buckets[bucketIndex].count += 1;
  }

  const total = values.length;
  const average = total ? values.reduce((sum, value) => sum + value, 0) / total : 0;
  const min = total ? Math.min(...values) : null;
  const max = total ? Math.max(...values) : null;
  const maxBucket = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return {
    key: scoreKey,
    label: scoreLabel,
    total,
    average,
    min,
    max,
    maxBucket,
    buckets
  };
}

function renderDistributionPanel(distribution) {
  return `
    <section class="distribution-panel">
      <div class="distribution-head">
        <div>
          <h3>${escapeHtml(distribution.label)}</h3>
          <span>${distribution.total} 个有效分数</span>
        </div>
        <strong>${distribution.total ? distribution.average.toFixed(2) : "-"}</strong>
      </div>
      <div class="distribution-stats">
        <span>最低 ${distribution.min == null ? "-" : distribution.min}</span>
        <span>最高 ${distribution.max == null ? "-" : distribution.max}</span>
      </div>
      <div class="histogram" aria-label="${escapeHtml(distribution.label)}分数分布">
        ${distribution.buckets
          .map((bucket) => {
            const height = distribution.maxBucket ? Math.max(3, (bucket.count / distribution.maxBucket) * 100) : 3;
            const percent = distribution.total ? Math.round((bucket.count / distribution.total) * 100) : 0;
            return `
              <div class="histogram-bin" title="${bucket.score} 分段：${bucket.count} 张，${percent}%">
                <div class="histogram-bar" style="height: ${height}%"></div>
                <span>${bucket.score}</span>
                <small>${bucket.count}</small>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function updateScoreFeedback(entryId, scoreKey, direction) {
  if (!state.session.active || state.session.mode !== "single") {
    renderSessionControls("请先在单张模式点击“开始评分”");
    return;
  }

  const entry = entries.find((item) => item.id === entryId);
  if (!entry) return;

  const previousValue = state.session.selections?.[entryId]?.[scoreKey] || null;
  const resultingValue = previousValue === direction ? null : direction;

  state.session.selections[entryId] ||= {};
  if (resultingValue) {
    state.session.selections[entryId][scoreKey] = resultingValue;
  } else {
    delete state.session.selections[entryId][scoreKey];
  }

  if (!Object.keys(state.session.selections[entryId]).length) delete state.session.selections[entryId];

  const scoreLabel = getScoreLabel(scoreKey);
  state.session.actions.push({
    index: state.session.actions.length + 1,
    timestamp: new Date().toISOString(),
    mode: "single",
    entryId,
    title: entry.title,
    createdAt: entry.createdAt,
    scoreKey,
    scoreLabel,
    originalScore: entry.scores?.[scoreKey] ?? null,
    clickedDirection: direction,
    clickedMeaning: direction === "low" ? "用户认为原分数偏低，可以更高" : "用户认为原分数偏高，可以更低",
    previousValue,
    resultingValue,
    action: resultingValue ? "set" : "clear"
  });

  state.session.updatedAt = new Date().toISOString();
  saveSession();
  renderSessionControls();
  renderViewer();
}

function updateScoreNote(entryId, note) {
  if (!state.session.active || state.session.mode !== "single") {
    renderSessionControls("请先在单张模式点击“开始评分”");
    return;
  }

  const entry = entries.find((item) => item.id === entryId);
  if (!entry) return;

  const trimmedNote = note.trim();
  state.session.notes ||= {};

  if (trimmedNote) {
    state.session.notes[entryId] = {
      entryId,
      title: entry.title,
      createdAt: entry.createdAt,
      scores: entry.scores,
      note,
      updatedAt: new Date().toISOString()
    };
  } else {
    delete state.session.notes[entryId];
  }

  state.session.updatedAt = new Date().toISOString();
  saveSession();
  renderSessionControls();
}

function startScoreSession() {
  if (state.mode === "guide" || state.mode === "overview") {
    renderSessionControls("请先切到单张模式或对比模式");
    return;
  }

  if (state.session.active && (state.session.actions.length || countSessionNotes())) {
    const shouldRestart = window.confirm("当前评分会话还没结束。要清空本轮记录并重新开始吗？");
    if (!shouldRestart) return;
  }

  const now = new Date().toISOString();
  state.session = {
    version: 1,
    mode: state.mode,
    sessionId: `${state.mode}-score-session-${compactTimestamp(new Date())}`,
    active: true,
    startedAt: now,
    updatedAt: now,
    selections: {},
    compareSelections: {},
    notes: {},
    actions: []
  };

  if (state.mode === "compare") setNextComparePair();
  if (state.mode === "single") state.comparePair = null;
  saveSession();
  renderSessionControls();
  renderViewer();
  renderCompare();
}

function endScoreSession() {
  if (!state.session.active) {
    renderSessionControls("还没有开始评分");
    return;
  }

  if (!state.session.actions.length && !countSessionNotes()) {
    state.session.active = false;
    state.session.endedAt = new Date().toISOString();
    state.session.selections = {};
    state.session.compareSelections = {};
    state.session.notes = {};
    state.comparePair = null;
    clearSavedSession();
    renderSessionControls("本轮没有记录，已结束");
    renderViewer();
    renderCompare();
    return;
  }

  const endedAt = new Date().toISOString();
  const archive = buildSessionArchive(endedAt);
  downloadJson(archive, `${state.session.sessionId}.json`);

  state.session.active = false;
  state.session.endedAt = endedAt;
  state.session.selections = {};
  state.session.compareSelections = {};
  state.session.notes = {};
  state.comparePair = null;
  clearSavedSession();
  renderSessionControls(`已导出 ${archive.actionCount} 次点击，${archive.noteCount} 条文字反馈`);
  renderViewer();
  renderCompare();
}

function buildSessionArchive(endedAt) {
  return {
    type: "photography-score-action-session",
    version: 2,
    mode: state.session.mode || "single",
    sessionId: state.session.sessionId,
    startedAt: state.session.startedAt,
    endedAt,
    generatedAt: new Date().toISOString(),
    source: {
      galleryGeneratedAt: data.generatedAt || "",
      totalEntries: entries.length
    },
    actionCount: state.session.actions.length,
    noteCount: countSessionNotes(),
    legend: {
      low: "用户认为原评分偏低，可以更高，对应界面 ↑",
      high: "用户认为原评分偏高，可以更低，对应界面 ↓",
      tie: "对比模式下用户认为两边差不多，或者难以评价",
      set: "本次点击设置该项反馈",
      clear: "本次点击取消该项反馈"
    },
    actions: state.session.actions,
    notes: Object.values(state.session.notes || {})
      .filter((item) => item.note && item.note.trim())
      .sort((a, b) => String(a.updatedAt || "").localeCompare(String(b.updatedAt || "")))
  };
}

function renderSessionControls(message = "") {
  els.startSession.disabled = state.session.active;
  els.endSession.disabled = !state.session.active;
  const modeLabel = state.session.active ? getModeLabel(state.session.mode) : getModeLabel(state.mode);
  els.sessionStatus.textContent =
    message ||
    (state.session.active
      ? `${modeLabel}评分中 · ${state.session.actions.length} 次点击 · ${countSessionNotes()} 条文字反馈`
      : state.session.endedAt
        ? "已结束"
        : `${modeLabel}未开始`);
}

function getModeLabel(mode) {
  if (mode === "overview") return "总览";
  if (mode === "guide") return "使用说明";
  return mode === "compare" ? "对比模式" : "单张模式";
}

function isScoringMode(mode) {
  return mode === "single" || mode === "compare";
}

function countSessionNotes() {
  return Object.values(state.session.notes || {}).filter((item) => item.note && item.note.trim()).length;
}

function loadSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "");
    if (parsed && parsed.version === 1 && parsed.active && Array.isArray(parsed.actions)) {
      parsed.mode ||= "single";
      parsed.selections ||= {};
      parsed.compareSelections ||= {};
      parsed.notes ||= {};
      return parsed;
    }
  } catch {
    // Ignore malformed localStorage from older experiments.
  }

  return {
    version: 1,
    mode: "",
    sessionId: "",
    active: false,
    startedAt: "",
    updatedAt: "",
    selections: {},
    compareSelections: {},
    notes: {},
    actions: []
  };
}

function saveSession() {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  } catch {
    renderSessionControls("浏览器本地存储不可用，结束评分仍可导出");
  }
}

function clearSavedSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getScoreLabel(scoreKey) {
  return SCORE_ITEMS.find(([key]) => key === scoreKey)?.[1] || scoreKey;
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function compactTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  return lines
    .map((line) => {
      if (!line.trim()) return "";
      if (/^#\s+/.test(line)) return "";
      if (/^##\s+/.test(line)) return `<h2>${escapeHtml(line.replace(/^##\s+/, ""))}</h2>`;
      if (/^###\s+/.test(line)) return `<h3>${escapeHtml(line.replace(/^###\s+/, ""))}</h3>`;
      if (/^####\s+/.test(line)) return `<h4>${escapeHtml(line.replace(/^####\s+/, ""))}</h4>`;
      if (/^-\s+/.test(line)) return `<p class="bullet">• ${formatInline(line.replace(/^-\s+/, ""))}</p>`;
      if (/^\d+\.\s+/.test(line)) return `<p class="numbered">${formatInline(line)}</p>`;
      return `<p>${formatInline(line)}</p>`;
    })
    .join("");
}

function formatInline(value) {
  return escapeHtml(value).replaceAll(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function renderEmpty(message) {
  els.mainImage.hidden = true;
  els.emptyState.hidden = false;
  els.emptyState.textContent = message;
  els.critique.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
}

function formatDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(new Date(`${key}T00:00:00+08:00`));
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.dateList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) return;
  state.dateKey = button.dataset.date;
  state.entryId = groups[state.dateKey][0]?.id || "";
  renderDates();
  renderThumbs();
  renderViewer();
});

els.dateList.addEventListener(
  "wheel",
  (event) => {
    if (els.dateList.scrollHeight <= els.dateList.clientHeight) return;
    const previousTop = els.dateList.scrollTop;
    els.dateList.scrollTop += event.deltaY;
    if (els.dateList.scrollTop !== previousTop) event.preventDefault();
  },
  { passive: false }
);

els.thumbList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  state.entryId = button.dataset.id;
  renderThumbs();
  renderViewer();
});

els.critique.addEventListener("click", (event) => {
  const feedbackButton = event.target.closest("[data-score-feedback]");
  if (feedbackButton) {
    updateScoreFeedback(
      feedbackButton.dataset.entryId,
      feedbackButton.dataset.scoreKey,
      feedbackButton.dataset.scoreFeedback
    );
  }
});

els.critique.addEventListener("input", (event) => {
  const noteInput = event.target.closest("[data-score-note]");
  if (!noteInput) return;
  updateScoreNote(noteInput.dataset.entryId, noteInput.value);
});

els.modeTabs.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.addEventListener("error", handleImageError, true);

els.compareControls.addEventListener("click", (event) => {
  const choiceButton = event.target.closest("[data-compare-choice]");
  if (choiceButton) {
    updateCompareChoice(
      choiceButton.dataset.pairId,
      choiceButton.dataset.scoreKey,
      choiceButton.dataset.compareChoice
    );
    return;
  }

  const nextButton = event.target.closest("[data-next-pair]");
  if (!nextButton) return;
  if (!state.session.active || state.session.mode !== "compare") {
    renderSessionControls("请先在对比模式点击“开始评分”");
    return;
  }
  setNextComparePair();
  renderCompare();
});

els.startSession.addEventListener("click", startScoreSession);
els.endSession.addEventListener("click", endScoreSession);
