/* ============================================================
   RS NOTES · utils.js
   通用工具：fetch、字数统计、阅读时长、LocalStorage、DOM 辅助
   ============================================================ */

/* 路径前缀检测：根据本脚本 src 中的 ../ 数量推算当前页面相对站点根目录的层级，
   供子目录页面（如 notes/article.html、research/project.html）拼接正确的相对 URL。 */
const __curScript = document.currentScript;
const __curSrc = __curScript ? (__curScript.getAttribute('src') || '') : '';
const __dotdots = (__curSrc.match(/\.\.\//g) || []).length;
const __PATH_PREFIX = __dotdots > 0 ? '../'.repeat(__dotdots) : '';

const RS = {
  /** 安全 fetch JSON，失败返回 fallback */
  async fetchJSON(url, fallback) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return fallback;
      return await res.json();
    } catch (e) {
      console.warn('[RS] fetch failed:', url, e);
      return fallback;
    }
  },

  /** 安全 fetch 文本 */
  async fetchText(url, fallback = '') {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return fallback;
      return await res.text();
    } catch (e) {
      console.warn('[RS] fetch failed:', url, e);
      return fallback;
    }
  },

  /** 统计字数（中文 + 英文单词） */
  countWords(text) {
    if (!text) return 0;
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const english = (text.match(/[a-zA-Z]+/g) || []).length;
    return chinese + english;
  },

  /** 阅读时长估算（200 字/分钟，向上取整，最小 1） */
  estimateReadingTime(text) {
    const total = RS.countWords(text);
    return Math.max(1, Math.ceil(total / 200));
  },

  /** 记录并返回阅读次数 */
  recordView(id) {
    const key = `article_views_${id}`;
    let count = parseInt(localStorage.getItem(key) || '0', 10);
    count += 1;
    localStorage.setItem(key, String(count));
    return count;
  },

  /** 读取阅读次数（不递增） */
  getViewCount(id) {
    return parseInt(localStorage.getItem(`article_views_${id}`) || '0', 10);
  },

  /** 读取 URL 查询参数 */
  getQuery(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /** 当前页面相对站点根目录的路径前缀（如 '../' 或 ''） */
  pathPrefix() { return __PATH_PREFIX; },

  /** 将站点根目录下的相对 URL 转换为当前页面可用的相对 URL；
   *  跳过绝对 URL、协议相对、hash、data/mailto/tel 等。 */
  url(u) {
    if (!u) return u;
    if (/^(https?:)?\/\//.test(u)) return u;
    if (/^(data:|mailto:|tel:|javascript:|#)/.test(u)) return u;
    if (u.charAt(0) === '/') return u;
    return __PATH_PREFIX + u;
  },

  /** 从 Markdown 纯文本提取摘要 */
  extractSummary(md, len = 80) {
    if (!md) return '';
    const text = md
      .replace(/^#+\s.*$/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]+\$/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[*_`>#-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > len ? text.slice(0, len) + '…' : text;
  },

  /** HTML 转义 */
  escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /** Markdown → HTML：先抽取数学公式占位，避免 Marked 误伤 `<`、`_`、`\` 等字符；
   *  代码块与行内代码优先匹配，其内部的 `$` 不会被当作公式分隔符。
   *  需要 marked 与 katex 已加载；缺失时降级为纯文本。 */
  renderMarkdown(md) {
    if (!md) return '';
    if (typeof marked === 'undefined') {
      return `<pre>${RS.escape(md)}</pre>`;
    }
    const hasKatex = typeof katex !== 'undefined';
    const mathStore = [];
    const PH = (i) => `@@RS_MATH_${i}@@`;
    let processed = md;
    if (hasKatex) {
      const tokenRe = /```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^\n$]+?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;
      processed = md.replace(tokenRe, (m) => {
        let isMath = false, display = false, content = '';
        if (m.startsWith('$$')) { isMath = true; display = true; content = m.slice(2, -2); }
        else if (m.startsWith('\\[')) { isMath = true; display = true; content = m.slice(2, -2); }
        else if (m.startsWith('\\(')) { isMath = true; display = false; content = m.slice(2, -2); }
        else if (m.startsWith('$')) { isMath = true; display = false; content = m.slice(1, -1); }
        if (!isMath) return m;
        const i = mathStore.length;
        mathStore.push({ content: content.trim(), display });
        return PH(i);
      });
    }
    marked.setOptions({ breaks: true, gfm: true });
    let html = marked.parse(processed);
    if (hasKatex && mathStore.length) {
      mathStore.forEach((m, i) => {
        let rendered;
        try {
          rendered = katex.renderToString(m.content, { displayMode: m.display, throwOnError: false });
        } catch (e) {
          rendered = `<span class="math-error">${RS.escape(m.content)}</span>`;
        }
        const ph = PH(i);
        if (m.display) {
          // marked 可能将占位符包进 <p>，替换整个段落以获得正确的块级公式
          html = html.replace(new RegExp('<p>\\s*' + ph + '\\s*</p>', 'g'), rendered);
        }
        html = html.replace(new RegExp(ph, 'g'), rendered);
      });
    }
    return html;
  },

  /** 防抖 */
  debounce(fn, wait = 200) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  /** 高亮关键词（用于搜索结果片段） */
  highlight(text, query) {
    if (!query) return RS.escape(text);
    const escaped = RS.escape(text);
    const q = RS.escape(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${q})`, 'ig'), '<mark>$1</mark>');
  },

  /** Toast 提示 */
  toast(msg, duration = 2200) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('is-show'), duration);
  },

  /** IntersectionObserver 滚动入场 */
  observeReveals(root = document) {
    const els = root.querySelectorAll('.reveal:not(.is-in)');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('is-in'), i * 60);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }
};

window.RS = RS;
