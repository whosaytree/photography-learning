# 文字一致性编码规则

文字一致性不直接靠感觉判断。先把每次点评编码成固定 JSON，再用公式计算一致性。

## 总体方法

1. 从每个 `run-N.md` 中提取结构化判断和问题标签。
2. 使用固定标签表，尽量不要临时发明新标签。
3. 如果自然语言不同但意思相同，归到同一个标签。
4. 编码完成后写入同一照片目录下的 `tags.json`。
5. `analyze-stability.mjs` 只读取 `run-*.md` 和 `tags.json`，用确定公式计算一致性。

prompt 可以用于“归一化编码”，但不用于直接下结论。也就是说，prompt 的输出是标签 JSON；稳定性结论由脚本公式计算。

## tags.json Schema

```json
{
  "run-1": {
    "subject": "主体描述",
    "genre": "题材",
    "basicProblemTier": "无",
    "capRule": "无",
    "intentionalEffectJudgment": "无明显故意处理",
    "highScoreEligible": "是",
    "issueTags": ["background_distraction", "weak_story"],
    "priorityIssueTags": ["background_distraction", "weak_story", "crop_can_improve"],
    "recommendationTags": ["change_angle", "crop_tighter", "simplify_background"]
  }
}
```

`basicProblemTier` 只能是：

- `无`
- `基础问题`
- `严重基础问题`

`highScoreEligible` 建议使用：

- `是`
- `否`
- `部分`

`capRule` 如果无封顶，写 `无`；如果有，尽量写成短标签，例如 `subject_weak_overall_max_5`。

## 问题标签

主体与叙事：

- `subject_unreadable`
- `subject_weak`
- `subject_too_small`
- `weak_story`
- `ordinary_documentation`
- `unclear_visual_intent`
- `weak_moment`
- `weak_emotion`

技术：

- `missed_focus_severe`
- `missed_focus_readable`
- `camera_shake_severe`
- `motion_blur_accidental`
- `underexposure_severe`
- `underexposure_mild`
- `overexposure_severe`
- `overexposure_mild`
- `noise_or_low_image_quality`
- `white_balance_issue`

构图：

- `chaotic_framing`
- `background_distraction`
- `edge_distraction`
- `awkward_crop`
- `tilted_horizon_or_verticals`
- `too_much_empty_space`
- `insufficient_depth`
- `weak_visual_path`
- `center_without_purpose`
- `composition_too_loose`
- `composition_too_tight`

光线：

- `flat_light`
- `harsh_light`
- `mixed_light`
- `backlight_uncontrolled`
- `poor_light_direction`
- `high_contrast_uncontrolled`
- `light_not_supporting_subject`

后期：

- `over_editing`
- `under_editing`
- `color_too_heavy`
- `contrast_too_heavy`
- `needs_straighten`
- `needs_crop`
- `needs_local_adjustment`

正向强项：

- `clear_subject`
- `strong_light`
- `good_atmosphere`
- `strong_composition`
- `good_moment`
- `strong_color`
- `good_depth`
- `clean_background`
- `interesting_subject`

## 建议动作标签

- `move_closer`
- `step_back`
- `change_angle`
- `lower_angle`
- `higher_angle`
- `wait_for_moment`
- `simplify_background`
- `use_grid_level`
- `focus_on_subject`
- `increase_shutter_speed`
- `lower_iso`
- `raise_exposure`
- `lower_exposure`
- `shoot_in_better_light`
- `use_side_light`
- `avoid_midday_light`
- `crop_tighter`
- `crop_wider`
- `straighten`
- `recover_highlights`
- `lift_shadows`
- `local_dodge_burn`
- `reduce_saturation`
- `adjust_white_balance`
- `add_contrast`
- `reduce_contrast`

## 编码 Prompt 模板

```text
你是摄影点评稳定性实验的编码员。你的任务不是重新点评照片，而是把以下 run 的文字结论归一成固定标签 JSON。

要求：
- 只根据这份 run 文本编码。
- 不评价这份点评是否正确。
- 优先使用 TEXT_CONSISTENCY_CODEBOOK.md 中已有标签。
- 自然语言不同但含义相同的判断，应归到同一个标签。
- `priorityIssueTags` 只取点评中最优先的 1-3 个问题，按优先级排序。
- `issueTags` 可以包含所有明确提到的问题和强项，但不要超过 8 个。
- `recommendationTags` 可以包含明确建议动作，不要超过 8 个。
- 只输出 JSON，不输出解释。

run 文本：
<run_markdown>
```

## 公式

类别字段一致率：

```text
一致率 = 最大同值次数 / 总 run 数
```

问题标签两两 Jaccard：

```text
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

照片级平均问题标签相似度：

```text
所有 run 两两 Jaccard 的平均值
```

前三优先问题重合率：

```text
top3_overlap(A, B) = |top3(A) ∩ top3(B)| / 3
```

第一优先问题一致率：

```text
第一优先一致率 = 最常见第一优先标签次数 / 总 run 数
```
