---
title: 用 Three.js 构建粒子网络背景
summary: 从零实现一个轻量级的黑底白点粒子网络背景：粒子漂移、近距离连线、鼠标视差与性能降级。
tags: [three.js, webgl, frontend]
date: 2026-06-20
---

首页 Hero 区的背景是一个轻量级粒子网络：黑底白点，粒子缓慢漂移，近距离时用线段连接，鼠标移动时相机轻微视差。

## 核心思路

粒子系统由三部分组成：

1. **粒子点** —— `THREE.Points` + `PointsMaterial`，存储位置与速度
2. **连线** —— `THREE.LineSegments`，每帧根据粒子两两距离动态更新顶点
3. **视差** —— 鼠标坐标驱动相机位置，缓动跟随

## 粒子位置更新

每个粒子在三维空间中独立漂移，超出边界后从对侧回归（wrap）：

```javascript
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const ix = i * 3;
  positions[ix]     += velocities[ix];
  positions[ix + 1] += velocities[ix + 1];
  positions[ix + 2] += velocities[ix + 2];

  if (positions[ix] >  half.x) positions[ix] = -half.x;
  if (positions[ix] < -half.x) positions[ix] =  half.x;
  // y、z 同理
}
pGeo.attributes.position.needsUpdate = true;
```

## 连线生成

连线的关键是「近距离判定」。为避免 $O(n^2)$ 在大粒子数下的开销，桌面端将粒子数控制在 120 左右，并用距离平方比较省去开方：

$$
d^2 = \Delta x^2 + \Delta y^2 + \Delta z^2 < D_{\max}^2
$$

```javascript
const max2 = LINK_DISTANCE * LINK_DISTANCE;
for (let i = 0; i < PARTICLE_COUNT; i++) {
  for (let j = i + 1; j < PARTICLE_COUNT; j++) {
    const dx = positions[i*3] - positions[j*3];
    const d2 = dx * dx + /* dy, dz */ 0;
    if (d2 < max2) {
      // 写入线段两端点
    }
  }
}
```

## 性能与降级

- 移动端（`< 768px`）粒子数降至 40，并关闭连线
- 使用 `IntersectionObserver` 监听 Hero 是否在视口内，离开时暂停 `requestAnimationFrame`
- `setPixelRatio` 限制为 2，避免高 DPI 屏过度采样

## 鼠标视差

相机位置用缓动跟随鼠标目标值，产生柔和的视差感：

$$
\vec{p}_{t+1} = \vec{p}_t + (\vec{p}_{\text{target}} - \vec{p}_t) \cdot \alpha, \quad \alpha = 0.04
$$

这个粒子背景总代码不到 150 行，却为整站奠定了第一印象。
