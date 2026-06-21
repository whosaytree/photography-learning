# 摄影点评稳定性实验

目标：检验同一张照片在同一套摄影点评流程下重复独立点评时，分数和文字判断的稳定性。

## 实验原则

1. 每张照片独立重复 5 次点评。
2. 5 次点评必须上下文隔离：每次只接收原图、统一任务说明、`AGENTS.md`、Photography Mastery skill、`SCORING_RUBRIC.md`。
3. 每次点评不能读取其他 run 的结果。
4. 5 次点评全部完成后，才进入汇总分析。
5. 实验结果写入本目录，不写入正式 `data/archive/`，避免污染日常摄影点评档案。

## 推荐图片集合

一次完整实验建议使用 4-6 张照片，覆盖：

- 强图：主体清楚，光线/构图/叙事至少两项明显强。
- 普通记录照：能看懂，但摄影意图弱。
- 明显硬伤图：虚焦、手抖、欠曝、过曝、主体太小等。
- 意图边界图：剪影、故意暗调、动态模糊、高反差、非典型构图。
- 不同题材：人像、风景、街拍、室内/静物等。

## 目录结构

```text
experiments/critique-stability-5x/
  README.md
  TEXT_CONSISTENCY_CODEBOOK.md
  prepare-test-set-from-archive.mjs
  analyze-stability.mjs
  photos/
    photo-01/
      original.<ext>
      prompt.md
      runs/
        run-1.md
        run-2.md
        run-3.md
        run-4.md
        run-5.md
      tags.json
      analysis.json
      analysis.md
    photo-02/
      ...
  summary/
    source-selection.json
    overall-analysis.md
```

## 从归档准备测试集

归档目录 `data/archive/` 只作为只读图片池。不要在归档目录或旧归档图片目录下写入任何实验文件。

使用脚本复制隔离测试集：

```bash
node experiments/critique-stability-5x/prepare-test-set-from-archive.mjs
```

脚本会：

- 从 `data/archive/` 读取原图、旧 metadata 和旧 critique。
- 只把原图复制到 `experiments/critique-stability-5x/photos/photo-XX/original.<ext>`。
- 为每张实验图生成独立 `prompt.md`。
- 把来源追溯信息写入 `summary/source-selection.json`。
- 不复制旧 critique 到每个 photo 目录，避免污染后续独立点评。

## 单次点评任务模板

每个子 agent 使用同一段任务，只替换 `photo_id`、`run_id`、`image_path` 和 `output_path`。

```text
你正在执行摄影点评稳定性实验中的一次独立 run。

约束：
- 不读取同一照片的其他 run 输出。
- 不读取 experiments/critique-stability-5x/photos/<photo_id>/runs/ 下除本次 output_path 外的文件。
- 不写入 data/archive/。
- 必须读取并遵守 /Users/bytedance/Documents/摄影学习/AGENTS.md。
- 必须读取并遵守 /Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md。
- 必须读取并遵守 /Users/bytedance/Documents/摄影学习/SCORING_RUBRIC.md。

输入图片：
<image_path>

请完整生成一次中文摄影点评，包含 AGENTS.md 要求的全部栏目。
将结果写入：
<output_path>
```

## 执行方式

优先使用隔离子 agent：

- 生成每个 run 时使用 `fork_context: false`。
- 每个子 agent 只拥有一个写入目标：`runs/run-N.md`。
- 5 个 run 可以并行启动。
- 汇总前不要把任何 run 的内容发给其他 run。

如果没有子 agent 工具，退化方案是让用户开 5 个独立新对话分别生成结果，再把 5 份结果放入 `runs/`。不要在同一条聊天里连续生成 5 次。

## 分析流程

1. 检查 5 个 run 是否都存在完整点评。
2. 用 `TEXT_CONSISTENCY_CODEBOOK.md` 把每个 run 编码为 `tags.json`。
3. 运行：

```bash
node experiments/critique-stability-5x/analyze-stability.mjs
```

4. 查看每张照片生成的 `analysis.json`。
5. 基于 `analysis.json` 写 `analysis.md` 和 `summary/overall-analysis.md`。

## 结论口径

分数稳定性主要看：

- 各维度极差。
- 各维度标准差。
- 总体分是否存在离群 run。
- 是否反复触发同一个封顶规则。

文字稳定性主要看：

- 主体、题材、基础问题等级、封顶规则、故意处理判断的一致率。
- 问题标签平均 Jaccard 相似度。
- 前三优先问题重合率。
- 第一优先问题一致率。
- 建议动作标签平均 Jaccard 相似度。

判断建议：

- 高稳定：总体分极差 <= 0.5，关键结构化判断一致率 >= 80%，问题标签平均 Jaccard >= 0.70。
- 中等稳定：总体分极差 <= 1.0，关键结构化判断一致率 >= 60%，问题标签平均 Jaccard >= 0.50。
- 明显漂移：总体分极差 > 1.0，或主体/硬伤/基础问题等级出现根本分歧。
