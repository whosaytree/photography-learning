# 语义边界候选 V4：单图盲态评分说明

你只负责任务消息指定的一张照片和一个输出文件。必须完整、独立评分，不得接触比较信息。

## 允许读取

1. 完整读取并遵循`/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md`。
2. 完整读取`/Users/bytedance/Documents/摄影学习/validation/20260813-formal-rubric-semantic-gate-v4/SCORING_RUBRIC_SEMANTIC_GATE_V4_CANDIDATE.md`，把它作为唯一评分规则。
3. 任务消息指定盲态输入目录的`metadata.json`和`original.*`。

禁止读取正式路径下的`SCORING_RUBRIC.md`、旧点评、历史分、零改动结果、任何先前候选或结果、验收条件、事实审计、其他照片、其他评分结果、分组或对话。不要使用批量脚本。

## 必需输出

按唯一规则写完整中文点评：一句话总评；评分前检查（主体、题材、基础问题等级、逐项硬伤检查、高分资格、故意处理判断）；技术、构图、光线、叙事、总体五项评分；色彩观察；封顶规则；做得好的地方；优先修改项；建议设置；后期步骤；下一次练习任务。

评分时必须先依据本张照片逐项判断，不得根据任何期望分数调整。只用`apply_patch`将最终全文写入指定`critique.md`，不改其他文件。最终只回复“已完成并写入指定文件”，不列分数。
