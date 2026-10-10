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

When multiple photos are critiqued in the same conversation, critique each current photo as a standalone image. During the scoring pass, ignore prior and later photos in the conversation, including their scores, strengths, flaws, scene similarity, shooting sequence, and any apparent improvement or decline. Do not use comparison language such as "better than the previous one" or "worse than the previous one" in the critique. Judge only the currently visible image and the user's explicit context for that image.

Before writing the final scores, explicitly perform a scoring pass:

1. Identify the main subject, intended genre, and whether the image is mainly ordinary documentation, evidence, product/signage record, damage/usefulness record, or a photograph with clear visual intent.
2. Decide the basic-problem tier: `无`, `基础问题`, or `严重基础问题`.
3. Before judging any rotation/orientation problem, actively check orientation sources. For archived local images, first read `metadata.json`, then inspect the local `original.*` with a metadata-capable source; do not rely on one viewer or one metadata command when it may miss EXIF orientation. If any available source reports EXIF orientation, a trusted visible-orientation note, or a trusted gallery/user display orientation, judge the photograph after that orientation is applied; never use the raw pixel matrix alone to mark a rotation error. When a raw preview appears sideways but orientation metadata or trusted display information exists, do not apply a rotation cap unless an explicitly orientation-corrected rendering is also checked and still blocks normal viewing. Treat this as an internal check: in `critique.md`, do not mention metadata filenames, preview filenames, tools, commands, or specific EXIF orientation values; only state whether the visible viewing direction itself blocks normal viewing when that affects the score.
4. For a discrete main subject or intended focal area expected to be sharp, make a forced choice: `reliable sharp anchor present` or `reliable sharp anchor absent`. If absent and the blur does not pass the intentional-effect tests, apply the readable-subject focus cap. Do not require a local sharp anchor solely because a photograph is organized as a frame-wide visual relationship.
5. For every dominant foreground or edge distraction already identified, make a forced choice: `removal only improves tidiness` or `removal clearly restores the main reading`. The latter triggers the distraction/crop/imbalance cap.
6. Check hard-flaw caps from `SCORING_RUBRIC.md` one by one, including dominant distractions, awkward crops, edge cuts, visual imbalance, and unclear landing points.
7. Decide whether any blur, darkness, high-key brightness, unusual framing, high contrast, small subject placement, negative space, backlit silhouette, direct flash, rough documentary texture, or collage/sequence structure is intentional using the rubric's intentional-effect tests.
8. Apply the low-end rule: severe basic failures normally score 3-4.5 overall; normal basic failures normally cap at 5 overall; ordinary documentation normally stays around 4.5-5.5 unless a clear photographic strength is visible.
9. Apply the escape rule only when the image has strong compensating expression, light, composition, moment, or subject interest; escaped basic-flaw or ordinary-documentation photos may reach 5-5.5, or approach 6 only when the compensating strength is clearly visible, but not higher unless the flaw is minor and at least two strengths are clear.
10. Identify story evidence as one of three levels: `记录信息`, `场景/情绪`, or `关系/瞬间/视觉想法`. If the evidence is only product information, damage evidence, readable signage, object usefulness, event explanation, or location identification, story normally stays at 5 or below. If visible mood, scale, atmosphere, gesture, relationship, contrast, moment, or visual idea exists, score story from that image evidence even when no people are present.
11. Perform a color observation pass. Identify the dominant color impression, color harmony or conflict, whether color helps subject separation or creates distraction, the emotional effect of the color, and any white balance, color cast, oversaturation, dullness, skin-tone, or dirty-shadow issue. Color is not a sixth score, but it can affect lighting, composition, story, technical judgment, and editing advice.
12. Apply the high-score check after caps: when the subject is clear, there is no severe hard flaw, edge/background/crop/visual balance are controlled, the visual path has a clear landing point when relevant, and at least two dimensions are clearly strong, actively decide whether the image belongs at 7.5, 8, or 8.5. If stopping at 7.5, name the specific limitation that prevents 8. Do not treat minor fixable flaws as equal to hard flaws.
13. Assign each score independently from this single image only, without referencing any other photo from the same conversation or archive batch.
14. Do not adjust scores to match any desired distribution.

If no hard-flaw cap applies, say `封顶规则：无` in the critique. If a cap applies, name the cap and keep the affected score at or below the cap.

Scores may use one decimal place when that helps express a real visual difference. This applies to all five scores: technical, composition, lighting, story, and overall. Do not use more than one decimal place, and do not add decimals when the distinction is not meaningful.

For re-evaluating old archive images, run this exact same full critique workflow from the image. Do not use a separate review pass, do not only replace the score section, and do not preserve old critique text unless it is regenerated as part of the same workflow.

## Output

Reply in Chinese for a beginner photographer. Be concrete, direct, and actionable. Do not invent EXIF, camera model, lens, settings, or location.

Include:

- 一句话总评
- 评分前检查：主体、题材、基础问题等级、硬伤封顶检查、高分资格、故意处理判断
- 五项评分：技术、构图、光线、叙事、总体
- 色彩观察：说明主色调、色彩感觉、搭配是否和谐、色彩对主体和情绪的作用，以及可执行的调色方向
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
- `thumb.jpg` and `preview.jpg` for gallery display when an image file is available

Prefer saving the actual uploaded chat attachment image. If the attachment is not exposed as a local file, record this in `metadata.json`:

```json
{
  "image_source": "chat_attachment",
  "image_file_saved": false
}
```

When the user provides a local image path, copy it into the archive as `original.<ext>`.

After writing the archive files, make the single new archive visible in the gallery by running:

```bash
node scripts/update-gallery-entry.mjs /Users/bytedance/Documents/摄影学习/data/archive/<archive-id>/
```

This single-entry update should generate only that archive's `thumb.jpg` and `preview.jpg`, upsert that archive into `gallery/data.js`, and update the gallery asset version in `gallery/index.html`.

Before the final reply, verify:

- `critique.md` exists
- `metadata.json` exists
- `original.<ext>` exists when the image could be saved/copied
- `thumb.jpg` and `preview.jpg` exist when an image file is available
- `gallery/data.js` contains the archive id

End the reply with the archive path and say whether the gallery was updated.

## Gallery Maintenance

When the user asks `更新看板`, `刷新看板`, or `补齐归档`, run the maintenance flow instead of re-critiquing images:

1. Run `node scripts/generate-gallery-images.mjs` to scan all archives and generate any missing gallery images.
2. Run `node scripts/build-gallery.mjs` to rebuild `gallery/data.js` from all complete archives.
3. Report incomplete archive directories that cannot appear in the gallery, such as directories missing `critique.md`.

## Stage Learning Journal

Batch-level learning history is stored separately from single-photo critiques under:

```text
/Users/bytedance/Documents/摄影学习/learning_journal/
```

When the user asks for an overall review of today's/new photos, a comparison with earlier work, an updated personal style description, or a learning-path summary:

1. Read `learning_journal/LATEST.md`, then read the formal stage entry it points to. Use `learning_journal/INDEX.md` when a longer history is needed.
2. Complete and archive every current single-photo critique independently under the normal scoring rules. Historical scores or style descriptions must not influence a current image's score.
3. Only after the single-image pass, compare the current batch with the latest formal stage entry at batch level: stable preferences, new tendencies, improved problems, repeated problems, and the next practice focus.
4. Create `learning_journal/entries/YYYY-MM-DD-stage-review.md` using `learning_journal/TEMPLATE.md`, then update both `learning_journal/INDEX.md` and `learning_journal/LATEST.md` so the new entry becomes the comparison baseline.
5. Clearly record the photo date range, count, source status, and previous formal entry. Do not compare a curated old-material selection as though it were one outing's hit rate.
6. If the discussion is only about one visual preference, photographer, technique, or incomplete subset, add a topical note under `learning_journal/notes/` and do not advance `LATEST.md`.
