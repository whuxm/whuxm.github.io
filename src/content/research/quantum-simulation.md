---
title: 量子态演化模拟器
description: 在浏览器中模拟量子态的时间演化，支持波函数可视化与测量坍缩。
cover: /research/quantum-simulation.jpg
tags: [quantum, simulation, physics]
status: completed
date: 2026-03
---

## 概述

本模拟器求解一维含时薛定谔方程，展示波函数随时间的演化。

## 控制方程

含时薛定谔方程：

$$
i\hbar \frac{\partial}{\partial t}\Psi(x,t) = \left[ -\frac{\hbar^2}{2m}\nabla^2 + V(x) \right]\Psi(x,t)
$$

采用有限差分法离散化，Crank-Nicolson 格式保证幺正性。

## 数值方法

```python
import numpy as np

def crank_nicolson_step(psi, H, dt):
    I = np.eye(len(psi))
    A = I + 0.5j * dt * H
    B = I - 0.5j * dt * H
    return np.linalg.solve(A, B @ psi)
```

## 结论

模拟器成功复现了势阱中粒子的能量本征态演化，并支持高斯波包的散射实验。
