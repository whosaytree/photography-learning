# v1.1.2 构图干扰“移除测试”候选改动

本候选只修复一项：评分已经识别出主导前景、边缘元素、阴影或明暗块，却因其没有物理遮挡主体而漏掉构图硬伤。

## 评分表替换文本

将现行“干扰／裁切／视觉失衡”一行替换为：

> A distraction, awkward crop, edge cut, or visual imbalance is a hard flaw when either (1) a clearly recognizable element unrelated to the intended reading is accidentally truncated at the frame edge, or (2) an unintended foreground or edge element, overlap, crop, shadow, or tonal mass creates competing visual weight and removing or excluding it would clearly restore the intended subject, main path, repetition, separation, or balance. If removal would only make the frame tidier, treat it as an ordinary flaw. Related content or natural continuation is not exempt when the restoration test is met; breadth, brightness, or darkness alone is not enough.

封顶数值保持不变：`Composition max 5.5; Overall max 6.0`。

## 评分流程新增动作

在逐项检查硬伤之前加入：

> For every dominant foreground or edge distraction already identified, make a forced choice: `removal only improves tidiness` or `removal clearly restores the main reading`. The latter triggers the distraction/crop/imbalance cap.

## 明确不改

- 不改任何分值或封顶数值。
- 不改主体、失焦、全幅视觉关系、普通记录、高分资格或故意效果规则。
- 不因为元素面积大、亮、暗、贴边或自然延续本身触发封顶。
