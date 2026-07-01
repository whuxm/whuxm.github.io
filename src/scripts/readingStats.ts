/* ============================================================
   RS NOTES · readingStats.ts
   阅读统计：字数 · 阅读时长 · 浏览次数（localStorage）
   ============================================================ */

/** 统计字数（中文按字计 + 英文按词计） */
export function countWords(text: string): number {
  if (!text) return 0;
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

/** 阅读时长估算（200 字/分钟，向上取整，最小 1） */
export function estimateReadingTime(text: string): number {
  const total = countWords(text);
  return Math.max(1, Math.ceil(total / 200));
}

/** 记录并返回浏览次数（递增） */
export function recordView(id: string): number {
  const key = `article_views_${id}`;
  let count = parseInt(localStorage.getItem(key) || '0', 10);
  count += 1;
  try {
    localStorage.setItem(key, String(count));
  } catch (e) {
    // localStorage 不可用时静默降级
  }
  return count;
}

/** 读取浏览次数（不递增） */
export function getViewCount(id: string): number {
  return parseInt(localStorage.getItem(`article_views_${id}`) || '0', 10);
}
