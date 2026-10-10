# v1.1.1 失焦清晰锚点候选改动

本候选只修复一个问题：照片有离散主体或预期焦区、该区域本应清楚，却没有可靠清晰细节时，失焦硬伤容易漏判。

## 评分表替换文本

将现行“可读主体明显失焦”一行替换为：

> When a photograph has a discrete main subject or intended focal area that is expected to be sharp, treat it as clearly out of focus when that area has no reliable sharp detail. Recognizable outline, color separation, or sharper unrelated background detail does not count as a sharp anchor and must not be used to downgrade the failure to ordinary softness. Do not apply this condition when the blur passes the intentional-effect tests, or solely because a frame-wide visual relationship has no local sharp point.

封顶数值保持不变：`Technical max 4.5; Overall max 5.0`。

## 评分流程新增动作

在方向检查之后、逐项检查硬伤之前加入：

> For a discrete main subject or intended focal area expected to be sharp, make a forced choice: `reliable sharp anchor present` or `reliable sharp anchor absent`. If absent and the blur does not pass the intentional-effect tests, apply the readable-subject focus cap. Do not require a local sharp anchor solely because a photograph is organized as a frame-wide visual relationship.

## 明确不改

- 不改任何分值或封顶数值。
- 不改全幅视觉关系、构图干扰、普通记录、高分资格或故意效果规则。
- 不把雾、低对比、浅景深、运动表达或无离散主体本身视为失焦证据。
