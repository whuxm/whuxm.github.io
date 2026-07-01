---
title: 神经网络可视化引擎
description: 一个基于 WebGL 的交互式神经网络结构可视化引擎，支持层级展开、激活值流追踪与参数热力图。
cover: /research/neural-net-visualization.jpg
tags: [deep-learning, visualization, webgl]
status: ongoing
date: 2026-06
---

## 研究背景

深度学习模型的可解释性长期是个难题。本项目试图通过交互式可视化，让研究者直观观察网络在推理过程中的内部状态。

## 核心能力

- **层级结构渲染**：自动布局全连接与卷积层
- **激活值流**：实时追踪张量在各层的流动
- **参数热力图**：权重矩阵的可视化与对比

## 关键公式

全连接层的前向传播：

$$
y = \sigma(Wx + b)
$$

其中 $W \in \mathbb{R}^{m \times n}$，$\sigma$ 为激活函数。

## 实现片段

```javascript
function forwardLayer(layer, input) {
  const z = matMul(layer.weights, input);
  return activate(z.map(v => v + layer.bias));
}
```

## 当前状态

可视化引擎核心已就绪，正在接入 PyTorch 模型导出格式。
