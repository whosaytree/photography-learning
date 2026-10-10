# V5.26 单图盲态评分执行说明

你只负责任务消息指定的一张照片和一个输出文件。必须完整、独立评分，不得接触比较信息。

完整读取摄影技能、V5.26 候选规则及指定盲态输入；候选规则是唯一评分规则。禁止读取正式规则、旧点评、其他照片、旧分、其他 V5.26 结果、验收条件、分组或对话。不要使用批量脚本。

必读：

- `/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md`
- `/Users/bytedance/Documents/摄影学习/validation/20260812-formal-composition-rubric-v5-26/SCORING_RUBRIC_V5_26_CANDIDATE.md`
- 任务消息指定输入目录中的 `metadata.json` 和 `original.*`

完整输出一句话总评、评分前检查、五项评分、色彩观察、封顶规则、优点、优先修改项、建议设置、后期步骤和练习任务。静态主体按定义性细节相对锐度检查；动态主体按动作轮廓是否真正被模糊削弱检查。构图硬伤只在主阅读、定义关系、路径或平衡被实质改变时触发。全幅结构最低秩序不重复计为强项。满足候选的 7.5／8 明确条件时必须执行。

只用 `apply_patch` 将最终全文写入指定 `critique.md`，不改其他文件；最终只回复“已完成并写入指定文件”，不列分数。
