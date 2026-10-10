# V9 扩展样本独立盲评说明

你只负责一个编号的一张照片。必须从零完成一次完整摄影点评与评分，不得参考任何其他照片、分数、分组、历史评价或本轮结果。

只允许读取：

1. 本目录的 `SCORING_RUBRIC_V9_CANDIDATE.md`；
2. `/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md`；
3. 分配给你的 `blind-inputs/NN/metadata.json` 与 `original.jpg`。

禁止读取：

- 正式 `SCORING_RUBRIC.md`；
- `SOURCE_MANIFEST.md`、原存档目录及原点评；
- 其他编号的照片、metadata 或结果；
- 旧分、验收条件、样本分组、其他规则版本及任何比较结论。

要求：

- 严格执行摄影技能和 V9 候选规则的全部评分流程；
- 检查方向、基础问题、全部硬伤封顶、故意处理、低端规则、叙事证据、色彩与高分资格；
- 五项评分均只依据当前单张照片；不得为分布、旧分或其他照片调整；
- 输出完整中文点评，包含规则要求的全部栏目；
- 若无封顶，明确写 `封顶规则：无`；若有封顶，写明类别并实际执行；
- 只用 `apply_patch` 写入指定 `results/NN/critique.md`，不得修改其他文件。

