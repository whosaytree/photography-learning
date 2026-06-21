# photo-20 稳定性分析

- 测试类型：animal_record_mid_score
- 抽样理由：Animal record photo at mid score; tests subject interest versus technical/composition limitations.
- 旧归档来源：20260604-220423-01685d88
- 结论等级：中等稳定

## 分数波动

| 维度 | 5 次分数 | 均值 | 极差 | 标准差 |
| --- | --- | ---: | ---: | ---: |
| 技术 | 6 / 5.5 / 6 / 5.5 / 5.5 | 5.7 | 0.5 | 0.245 |
| 构图 | 5 / 5 / 5 / 5 / 5 | 5 | 0 | 0 |
| 光线 | 5 / 5 / 5 / 5 / 5 | 5 | 0 | 0 |
| 叙事 | 4.8 / 4.5 / 4.5 / 4.5 / 4.5 | 4.56 | 0.3 | 0.12 |
| 总体 | 5.2 / 5 / 5 / 5 / 5 | 5.04 | 0.2 | 0.08 |

## 文字一致性

- 基础问题等级一致率：100%，多数判断：基础问题
- 封顶规则一致率：100%，多数判断：background_distraction_ordinary_documentation_flat_light_weak_story_overall_max_6
- 高分资格一致率：100%，多数判断：否
- 问题标签平均 Jaccard：0.671
- 前三优先问题平均重合率：0.567
- 第一优先问题一致率：100%，多数第一问题：background_distraction
- 建议动作平均 Jaccard：0.657

## 解释

总体分稳定，文字问题标签有少量漂移，但核心判断没有明显分裂。

备注：`subject` 和 `genre` 字段是自由文本，精确字符串一致率会低估语义一致性；本报告更看重基础问题等级、封顶规则、高分资格、问题标签和建议动作。
