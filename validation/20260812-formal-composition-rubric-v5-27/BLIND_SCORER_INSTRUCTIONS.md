# V5.27 单图盲态评分执行说明

你只负责指定的一张照片。完整读取摄影技能、V5.27 候选规则、指定输入的 metadata 与原图；候选是唯一评分规则。禁止读取正式规则、旧点评、旧分、其他照片、其他结果、验收、分组或对话；不要使用批量脚本。

必读：

- `/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md`
- `/Users/bytedance/Documents/摄影学习/validation/20260812-formal-composition-rubric-v5-27/SCORING_RUBRIC_V5_27_CANDIDATE.md`
- 任务指定输入目录的 `metadata.json` 与 `original.*`

完整输出所有必需栏目。对焦先判断题材是否依赖精细静态细节；环境/动作照片只有轮廓、手势和空间关系变得不连贯才触发硬伤。构图硬伤看是否实质改变主阅读。全幅最低可读秩序不计强项。7.5 要求两项独立 7 级维度共同承载核心效果；8 的明确条件满足时不能停在 7.5。

只用 `apply_patch` 写入指定 `critique.md`，不改其他文件。最终只回复“已完成并写入指定文件”。
