/* ============================================================
   RS NOTES · readingStats.ts
   阅读统计：字数 · 阅读时长 · 浏览次数（localStorage + Firebase Firestore）
   ============================================================ */

import { doc, getDoc, setDoc, increment, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

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

/** 更新阅读次数（Firestore 原子递增；同设备仅累计一次；未配置/失败回退 localStorage） */
export async function updateViews(slug: string): Promise<number> {
  const viewedKey = `viewed-${slug}`;
  const localKey = `article_views_${slug}`;

  if (localStorage.getItem(viewedKey)) {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'posts', slug));
        const views = (snap.data()?.views as number) ?? 0;
        if (views) { try { localStorage.setItem(localKey, String(views)); } catch {} }
        return views || getViewCount(slug);
      } catch {
        return getViewCount(slug);
      }
    }
    return getViewCount(slug);
  }

  try { localStorage.setItem(viewedKey, 'true'); } catch {}

  if (!isFirebaseConfigured || !db) {
    return recordView(slug);
  }

  try {
    const ref = doc(db, 'posts', slug);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { views: 1 });
      try { localStorage.setItem(localKey, '1'); } catch {}
      return 1;
    }
    await updateDoc(ref, { views: increment(1) });
    const updated = await getDoc(ref);
    const views = (updated.data()?.views as number) ?? 0;
    try { localStorage.setItem(localKey, String(views)); } catch {}
    return views;
  } catch {
    return recordView(slug);
  }
}
