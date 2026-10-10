# 形式构图评分 Rubric V2 校准

本目录用于验证候选评分标准，不改动正式 `SCORING_RUBRIC.md`，也不回写 `data/archive/` 中的旧点评。

校准约束：

- 35张样本：预设主体、路径、全幅秩序各9张，分区形面8张，并覆盖低、中、高完成度；
- 每张由一次全新的独立任务完成；
- 评分任务只能读取候选规则、摄影基础框架、该照片的 `metadata.json` 与 `original.*`；
- 禁止读取旧 `critique.md`、其他样本、样本分组、旧分数和批次背景；
- 不使用脚本、批量提示或一次多图评分；
- 每张输出完整点评到独立文件；
- 所有新评完成以后，主任务才读取旧点评并制作差异和验收报告。

候选规则：[SCORING_RUBRIC_V2_CANDIDATE.md](./SCORING_RUBRIC_V2_CANDIDATE.md)

样本清单：[sample-manifest.md](./sample-manifest.md)

最终产物将包括：

- `results/<archive-id>/critique.md`：35份独立新评；
- `comparison.md`：新旧评分逐张对照；
- `acceptance-report.md`：验收结果与是否建议替换正式标准。
