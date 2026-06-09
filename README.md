# 摄影学习聊天工作流

这个项目不再需要网页服务，也不需要 `OPENAI_API_KEY`。

项目级触发提示词写在 [AGENTS.md](/Users/bytedance/Documents/摄影学习/AGENTS.md)。新对话进入这个工作区时，应优先按 `AGENTS.md` 执行；README 只是人类说明。

评分规则写在 [SCORING_RUBRIC.md](/Users/bytedance/Documents/摄影学习/SCORING_RUBRIC.md)。它定义 5 分基准线、1-10 分档位、基础硬伤封顶规则、基础问题逃逸规则、高分资格检查，以及如何判断故意模糊和意外虚焦。

以后在当前 Codex/ChatGPT 对话里，你只需要上传一张照片并写：

```text
摄影点评
```

我就会自动执行完整流程：

1. 读取并使用这个摄影 skill：

```text
/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md
```

2. 从新手学习角度评价照片：

- 总评
- 技术、构图、光线、叙事、总体评分
- 按 `SCORING_RUBRIC.md` 使用 5 分基准线、封顶规则、硬伤扣分、基础问题逃逸规则和高分资格检查
- 做得好的地方
- 最优先修改的 3-5 个问题
- 下次重拍建议
- 这张图的后期补救建议
- 下一次练习任务

3. 把评价存档到：

```text
/Users/bytedance/Documents/摄影学习/data/archive/
```

## 推荐触发方式

最简单：

```text
摄影点评
```

带目标：

```text
摄影点评：重点看构图和光线
```

带本地图片路径：

```text
摄影点评：/Users/bytedance/Pictures/photo.jpg
```

如果你在聊天里上传图片，我会优先把聊天附件原图保存进归档目录。

如果附件在当前环境里没有暴露为可复制文件，我才会降级保存评价和“图片来自聊天附件”的说明。你也可以直接给本地图片路径，这种情况一定会复制原图。

## 归档格式

每次评价会创建一个目录：

```text
data/archive/<归档ID>/
```

常见文件：

```text
critique.md
metadata.json
original.<ext>    # 聊天附件或本地图片路径可复制时会存在
```

`data/archive/` 已加入 `.gitignore`，默认不会把照片提交进 Git。

## 静态看板

看板入口：

```text
gallery/index.html
```

每次归档有新增后，重新生成看板数据：

```bash
node scripts/build-gallery.mjs
```

看板会读取生成的 `gallery/data.js`，按日期分组展示归档。点击日期后选择图片，可以查看大图和完整摄影点评。

### 评分模式

看板有两个模式：

- `单张模式`：查看单张照片、点评和原评分，并反馈某个分数偏高或偏低。
- `对比模式`：随机抽取两张归档照片，不展示原评分，只让你判断五个维度里哪张更高。
- `使用说明`：在页面里查看单张模式和对比模式的操作流程。
- `总览`：查看所有归档图片在五个评分维度上的分数分布。

#### 单张模式

切到 `单张模式` 后，先点击左下角 `开始评分`，再按日期选择照片。

五个评分项后面有两个按钮：

- `↑`：你认为这个分数偏低，可以更高
- `↓`：你认为这个分数偏高，可以更低

点击左下角 `开始评分` 后，接下来每一次箭头点击都会被记录为一条动作，包括照片 ID、评分维度、原分数、点击方向、点击时间、是设置还是取消。

五个评分下面有 `评分反馈` 输入框，可以写你对当前这张照片评分或点评的整体看法。切换照片后，本轮已经写过的文字反馈会保留。

点击左下角 `结束评分` 会导出本轮评分会话的 JSON 文件，文件名类似：

```text
score-session-20260609-153000.json
```

导出的 JSON 里包含：

- `actions`：每一次高/低箭头点击
- `notes`：每张照片的文字评分反馈

之后把这个 JSON 文件发给我，我就可以按点击轨迹和文字反馈分析你认为当前评分系统整体偏高还是偏低，以及具体偏在哪些维度。

#### 对比模式

切到 `对比模式` 后点击左下角 `开始评分`，页面会随机抽取两张照片。每个维度只显示：

- 左图更高
- 右图更高
- 难说

不会展示原来的模型分数。`难说` 表示两边差不多，或者这个维度难以评价。点击 `换一组` 会随机抽取下一组。点击左下角 `结束评分` 后，导出的 JSON 仍然使用 `actions` 字段记录每次选择；每条记录都包含左右两张照片的 ID、标题、评分维度、被选为更高的一张照片 ID，或 `isTieOrUnclear: true`。

## 旧图重评

旧图重评必须和新图点评使用同一套流程：

1. 读取原图。
2. 读取 Photography Mastery skill。
3. 读取 `SCORING_RUBRIC.md`。
4. 完整重新生成 `critique.md`。
5. 更新 `metadata.json` 中必要的时间或说明。
6. 运行 `node scripts/build-gallery.mjs` 更新看板。

不要使用单独的评分复核、分布校正、只替换评分段、批量归一化或另一套人工评分体系。要比较流程效果，就比较同一张图在不同 prompt/rubric 下完整跑出来的点评结果。

新版评分流程不再把 5 分当作低分保护线：严重基础问题可以进入 3-4.5；普通基础问题通常不超过 5；如果基础问题存在但表达、光线、构图或瞬间很强，可以按逃逸规则进入 5-6。主体清楚且至少两个维度明显强的照片，应主动考虑 7.5 或 8。

五项评分都允许使用一位小数，包括技术、构图、光线、叙事和总体；小数只用于表达真实可见的差异，不做伪精确。

当前批量重跑命令：

```bash
node scripts/rerun-current-flow-critiques.mjs
node scripts/build-gallery.mjs
```

这个脚本会完整覆盖每个归档的 `critique.md`，并在 `metadata.json` 里记录本次使用的 skill、rubric 和重跑时间。

## 辅助脚本

如果需要手动把一段评价归档，可以使用：

```bash
node scripts/archive-chat-critique.mjs --title "照片标题" --image "/path/to/photo.jpg" < critique.md
```

`--image` 是可选参数。
