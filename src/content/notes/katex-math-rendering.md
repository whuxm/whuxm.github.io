---
title: KaTeX 数学公式渲染速查
summary: 行内公式、块级公式、常用符号与矩阵的 KaTeX 写法示例，配合 auto-render 自动识别。
tags: [katex, math, guide]
date: 2026-06-12
---

RS NOTES 的笔记页使用 [KaTeX](https://katex.org/) 渲染数学公式，配合 `auto-render` 自动识别分隔符。

## 行内公式

用单 `$` 包裹，例如质能方程 $E = mc^2$，或欧拉公式 $e^{i\pi} + 1 = 0$。

## 块级公式

用 `$$` 包裹，独占一行：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

高斯分布的概率密度函数：

$$
f(x) = \frac{1}{\sigma \sqrt{2\pi}} \exp\left( -\frac{(x - \mu)^2}{2\sigma^2} \right)
$$

## 常用符号

| 写法 | 渲染 |
|------|------|
| `\sum_{i=1}^{n} i` | $\sum_{i=1}^{n} i$ |
| `\frac{a}{b}` | $\frac{a}{b}$ |
| `\sqrt{x}` | $\sqrt{x}$ |
| `\alpha \beta \gamma` | $\alpha \beta \gamma$ |
| `\nabla` | $\nabla$ |
| `\partial` | $\partial$ |

## 矩阵

使用 `\begin{matrix}` 环境：

$$
A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix}, \quad \vec{x} = \begin{bmatrix} x_1 \\ x_2 \end{bmatrix}
$$

矩阵乘法的微分：

$$
\frac{\partial}{\partial X} \text{tr}(AX) = A^\top
$$

## 自动识别

`auto-render` 会扫描页面文本，按以下分隔符识别公式：

```javascript
renderMathInElement(container, {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ],
  throwOnError: false
});
```

> 注意：`throwOnError: false` 可避免单个公式错误导致整页渲染中断。
