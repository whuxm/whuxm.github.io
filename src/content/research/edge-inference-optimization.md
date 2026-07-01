---
title: 边缘端推理优化框架
description: 面向资源受限设备的轻量级推理框架，融合量化、剪枝与蒸馏，目标在嵌入式 GPU 上实现实时推理。
cover: /research/edge-inference-optimization.jpg
tags: [edge-computing, optimization, deployment]
status: planning
date: 2026-07
---

## 动机

边缘设备算力有限，但实时性要求高。本项目探索模型压缩的协同优化路径。

## 优化手段

- **量化**：FP32 → INT8，理论加速 $4\times$
- **剪枝**：移除冗余连接，减少 FLOPs
- **蒸馏**：大模型向小模型迁移知识

## 加速比模型

$$
S = \frac{T_{\text{baseline}}}{T_{\text{quantized}} + T_{\text{overhead}}}
$$

## 规划

目前处于方案设计阶段，计划 Q3 完成原型实现。
