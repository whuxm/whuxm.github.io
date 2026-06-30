# 笔记阅读统计系统的设计

RS NOTES 的笔记页支持阅读统计：阅读次数与预计阅读时长。整个系统无需后端，完全依赖浏览器本地存储。

## 阅读次数

每次进入笔记详情页，对应笔记的计数器自增。存储键格式为 `article_views_{id}`：

```javascript
function recordView(id) {
  const key = `article_views_${id}`;
  const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(count));
  return count;
}
```

> 阅读次数是本地的，不跨设备同步。这是「无后端」架构的取舍 —— 简单优先。

## 阅读时长估算

按 **200 字/分钟** 的阅读速度估算。字数统计同时考虑中文与英文：

$$
T_{\text{min}} = \left\lceil \frac{N_{\text{cn}} + N_{\text{en}}}{200} \right\rceil
$$

其中 $N_{\text{cn}}$ 是中文字符数，$N_{\text{en}}$ 是英文单词数。

```javascript
function countWords(text) {
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

function estimateReadingTime(text) {
  return Math.max(1, Math.ceil(countWords(text) / 200));
}
```

## 显示位置

统计信息在两处展示：

1. **笔记列表卡片** —— 显示已有阅读次数
2. **笔记详情页顶部** —— 显示阅读次数、预计阅读时间、总字数

## 设计取舍

| 方案 | 优点 | 缺点 |
|------|------|------|
| LocalStorage | 零后端、即开即用 | 不跨设备、可被清除 |
| 后端计数 | 跨设备、可统计 | 需服务端、复杂度高 |

RS NOTES 选择前者，保持纯静态架构的简洁。后续可平滑迁移到后端计数。
