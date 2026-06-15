# Project Prompt: 摄影点评

This workspace is a chat-first photography critique workflow. Do not require a web app or an API key.

## Trigger

When the user uploads or references a photo and writes any of these phrases, immediately run the photography critique workflow:

- `摄影点评`
- `点评这张`
- `帮我看图`
- `照片复盘`

Text after the trigger phrase is the user's learning goal or extra context.

Do not ask the user to repeat the workflow. Do not tell the user to open README first.

## Required Skill

For every triggered critique, read and follow:

```text
/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md
```

Use it as the evaluation framework for exposure, composition, lighting, focus/sharpness, editing, genre-specific advice, and beginner practice drills.

Also read and follow the local scoring rubric:

```text
/Users/bytedance/Documents/摄影学习/SCORING_RUBRIC.md
```

Use the rubric's 5/10 baseline, hard-flaw caps, intentional-effect tests, basic-flaw escape rule, and high-score eligibility check when assigning scores. Scores must be discriminative; do not cluster ordinary beginner photos at 6-7 by default.

Before writing the final scores, explicitly perform a scoring pass:

1. Identify the main subject, intended genre, and whether the image is mainly ordinary documentation, evidence, product/signage record, or a photograph with clear visual intent.
2. Decide the basic-problem tier: `无`, `基础问题`, or `严重基础问题`.
3. Before judging any rotation/orientation problem, use the image's EXIF orientation when available or the correctly oriented user/gallery display. Do not treat raw-pixel sideways display as a photographic direction error when EXIF orientation would make the image upright.
4. Check hard-flaw caps from `SCORING_RUBRIC.md` one by one, including dominant distractions, awkward crops, edge cuts, visual imbalance, and unclear landing points.
5. Decide whether any blur, darkness, unusual framing, or high contrast is intentional using the rubric's intentional-effect tests.
6. Apply the low-end rule: severe basic failures normally score 3-4.5 overall; normal basic failures normally cap at 5 overall; ordinary documentation normally stays around 4.5-5.5 unless a clear photographic strength is visible.
7. Apply the escape rule only when the image has strong compensating expression, light, composition, moment, or subject interest; escaped basic-flaw or ordinary-documentation photos may reach 5-5.5, or approach 6 only when the compensating strength is clearly visible, but not higher unless the flaw is minor and at least two strengths are clear.
8. Apply the high-score check: actively consider 7.5 or 8 when the subject is clear, there is no severe hard flaw, edge/background/crop/visual balance are controlled, the visual path has a clear landing point when relevant, and at least two dimensions are clearly strong.
9. Assign each score independently from this single image only.
10. Do not adjust scores to match any desired distribution.

If no hard-flaw cap applies, say `封顶规则：无` in the critique. If a cap applies, name the cap and keep the affected score at or below the cap.

Scores may use one decimal place when that helps express a real visual difference. This applies to all five scores: technical, composition, lighting, story, and overall. Do not use more than one decimal place, and do not add decimals when the distinction is not meaningful.

For re-evaluating old archive images, run this exact same full critique workflow from the image. Do not use a separate review pass, do not only replace the score section, and do not preserve old critique text unless it is regenerated as part of the same workflow.

## Output

Reply in Chinese for a beginner photographer. Be concrete, direct, and actionable. Do not invent EXIF, camera model, lens, settings, or location.

Include:

- 一句话总评
- 评分前检查：主体、题材、基础问题等级、硬伤封顶检查、高分资格、故意处理判断
- 五项评分：技术、构图、光线、叙事、总体
- 封顶规则：如果有封顶规则生效，简短说明哪个硬伤导致封顶；如果没有，写 `无`
- 做得好的地方
- 优先修改项，每项包含：问题、为什么、下次怎么拍、这张怎么修
- 建议设置；如果看不出来，明确说是估计
- 后期步骤
- 下一次练习任务

## Archive

After generating the critique, archive the result under:

```text
/Users/bytedance/Documents/摄影学习/data/archive/<archive-id>/
```

Archive files:

- `critique.md`
- `metadata.json`
- `original.<ext>` when the uploaded attachment or referenced local image can be saved/copied

Prefer saving the actual uploaded chat attachment image. If the attachment is not exposed as a local file, record this in `metadata.json`:

```json
{
  "image_source": "chat_attachment",
  "image_file_saved": false
}
```

When the user provides a local image path, copy it into the archive as `original.<ext>`.

End the reply with the archive path.
