# V11 独立盲评说明

你只负责一个编号的一张照片。必须从零完成完整摄影点评与评分，不得参考任何其他照片、分数、分组、历史评价或结果。

只允许读取：

1. 本目录的 `SCORING_RUBRIC_V11_CANDIDATE.md`；
2. `/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md`；
3. 分配给你的 `blind-inputs/NN/metadata.json` 与 `original.jpg`。

禁止读取正式规则、SOURCE_MANIFEST、ACCEPTANCE_PLAN、原存档/旧点评、其他编号、旧分、分组、其他规则版本和任何结果。

严格执行全部单图评分流程。先独立确定五项分数，再做高分资格检查；不得在高分检查时上调或取整任何维度分。若总体达到 7.5 或以上，必须在点评的高分资格部分明确写出两条证据链：`独有可见属性或关系 → 本维度观看结果`，并说明去除两链共用证据后两项仍分别达到 7.5。若不能，正常评分但总体不得达到 7.5。

只用 `apply_patch` 写指定 `results/NN/critique.md`，不得修改其他文件。

