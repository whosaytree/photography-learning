# V5.29 单图盲态评分执行说明

你只负责任务消息指定的一张照片和一个输出文件。必须完整、独立评分，不得接触比较信息。

完整读取摄影技能、V5.29 候选规则及指定盲态输入；候选规则是唯一评分规则。禁止读取正式规则、旧点评、其他照片、旧分、其他结果、验收条件、分组或对话。不要使用批量脚本。

必读：

- `/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md`
- `/Users/bytedance/Documents/摄影学习/validation/20260812-formal-composition-rubric-v5-29/SCORING_RUBRIC_V5_29_CANDIDATE.md`
- 任务消息指定输入目录中的 `metadata.json` 和 `original.*`

完整输出一句话总评、评分前检查、五项评分、色彩观察、封顶规则、优点、优先修改项、建议设置、后期步骤和练习任务。逐项检查硬伤；硬伤上限不是目标。静态或定义性主体按关键细节是否存在可靠锐利平面检查。两个高分强项必须产生分别可见的结果；普通技术清楚不是高分第二强项，除非它对定义性细节、关键时机或困难影调有可见贡献。次要非硬伤边缘问题可以限制 8，但不能自动取消已经成立的两项 7 级证据。

只用 `apply_patch` 将最终全文写入指定 `critique.md`，不改其他文件；最终只回复“已完成并写入指定文件”，不列分数。
