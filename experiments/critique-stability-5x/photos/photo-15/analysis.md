# photo-15 稳定性分析

- 测试类型：orientation_architecture
- 抽样理由：Architecture/water scene with prior orientation issue; tests whether orientation and composition caps are stable.
- 旧归档来源：20260604-211358-mosque-arcade-water
- 结论等级：明显漂移

## 分数波动

| 维度 | 5 次分数 | 均值 | 极差 | 标准差 |
| --- | --- | ---: | ---: | ---: |
| 技术 | 7 / 6.5 / 6.5 / 6.5 / 6.5 | 6.6 | 0.5 | 0.2 |
| 构图 | 5 / 5.2 / 4.5 / 5 / 4 | 4.74 | 1.2 | 0.436 |
| 光线 | 6 / 5.5 / 5.5 / 5.5 / 5.5 | 5.6 | 0.5 | 0.2 |
| 叙事 | 5 / 5 / 4.5 / 5 / 5 | 4.9 | 0.5 | 0.2 |
| 总体 | 5.6 / 5.8 / 4.5 / 5.5 / 4.5 | 5.18 | 1.3 | 0.564 |

## 文字一致性

- 基础问题等级一致率：60%，多数判断：基础问题
- 封顶规则一致率：80%，多数判断：tilted_horizon_or_verticals_overall_max_6_5
- 高分资格一致率：100%，多数判断：否
- 问题标签平均 Jaccard：0.911
- 前三优先问题平均重合率：0.667
- 第一优先问题一致率：100%，多数第一问题：tilted_horizon_or_verticals
- 建议动作平均 Jaccard：0.778

## 解释

存在明显漂移，需要回看 run 文本，判断是评分规则不清还是标签编码不稳。

备注：`subject` 和 `genre` 字段是自由文本，精确字符串一致率会低估语义一致性；本报告更看重基础问题等级、封顶规则、高分资格、问题标签和建议动作。
