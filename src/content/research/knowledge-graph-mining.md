---
title: 学术知识图谱挖掘
description: 从论文语料中抽取实体与关系，构建可查询的学术知识图谱，支持跨学科关联发现。
cover: /research/knowledge-graph-mining.jpg
tags: [knowledge-graph, nlp, mining]
status: ongoing
date: 2026-05
---

## 研究目标

构建跨学科的学术知识图谱，揭示研究主题间的隐含关联。

## 技术路线

1. **实体抽取** —— 命名实体识别（NER）定位方法、数据集、指标
2. **关系抽取** —— 分类实体间语义关系
3. **图谱构建** —— Neo4j 存储与查询

## 图谱规模

| 维度 | 规模 |
|------|------|
| 论文数 | 12,000+ |
| 实体数 | 48,000+ |
| 关系数 | 130,000+ |

## 查询示例

```cypher
MATCH (m:Method)-[:USED_IN]->(p:Paper)-[:CITES]->(q:Paper)
WHERE m.name = 'Transformer'
RETURN count(q) AS citations
```

## 下一步

引入图神经网络进行链接预测，发现潜在的研究关联。
