/* ============================================================
   RS NOTES · note-detail.js
   笔记详情：Marked + KaTeX + Prism + 自动 TOC + 阅读统计
   注：此脚本由 notes/article.html 加载，相对路径基于 notes/ 目录
   ============================================================ */

(function () {
  function highlight(container) {
    if (typeof Prism !== 'undefined') Prism.highlightAllUnder(container);
  }

  /** 自动 TOC：遍历 h2/h3，生成 id 与侧边目录，并实现滚动高亮 */
  function buildTOC(container) {
    const headings = container.querySelectorAll('h2, h3');
    if (!headings.length) return null;
    const tocItems = [];
    headings.forEach((h, i) => {
      const text = h.textContent.trim();
      const slug = 'h-' + i + '-' + text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
      h.id = slug;
      const cls = h.tagName === 'H3' ? 'toc-l3' : '';
      tocItems.push(`<li><a class="${cls}" href="#${slug}" data-toc="${slug}">${RS.escape(text)}</a></li>`);
    });
    const nav = document.createElement('aside');
    nav.className = 'note-toc';
    nav.innerHTML = `<h4>Contents</h4><ul>${tocItems.join('')}</ul>`;
    return nav;
  }

  /** 滚动高亮 TOC */
  function bindScrollSpy(container, tocNav) {
    if (!tocNav || !('IntersectionObserver' in window)) return;
    const links = tocNav.querySelectorAll('[data-toc]');
    const byId = {};
    links.forEach(l => { byId[l.dataset.toc] = l; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('is-active'));
          const link = byId[e.target.id];
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-72px 0px -70% 0px' });
    container.querySelectorAll('h2, h3').forEach(h => io.observe(h));
  }

  async function init() {
    const id = RS.getQuery('id');
    const root = document.querySelector('[data-note-content]');
    if (!id) {
      root.innerHTML = `<div class="state-empty"><h3>缺少笔记 ID</h3><p><a href="../notes.html">返回笔记页</a></p></div>`;
      return;
    }

    const idx = await RS.fetchJSON('index.json', { notes: [] });
    const meta = (idx.notes || []).find(n => n.id === id);
    if (!meta) {
      root.innerHTML = `<div class="state-empty"><h3>未找到该笔记</h3><p><a href="../notes.html">返回笔记页</a></p></div>`;
      return;
    }

    document.title = `${meta.title} · RS NOTES`;

    // 拉取 Markdown 原文
    const md = await RS.fetchText(meta.file, '> 笔记内容加载失败。');
    const readingTime = RS.estimateReadingTime(md);
    const wordCount = RS.countWords(md);
    const views = RS.recordView(id);

    root.innerHTML = `
      <div class="note-detail__header">
        <span class="eyebrow">${RS.escape(meta.date || '')}</span>
        <h1 class="note-detail__title">${RS.escape(meta.title)}</h1>
        <div class="note-detail__meta">
          <span>📅 ${RS.escape(meta.date || '')}</span>
          <span>👁 ${views} views</span>
          <span>⏱ 约 ${readingTime} 分钟阅读</span>
          <span>📝 ${wordCount} 字</span>
        </div>
      </div>
      <div class="note-detail__body">
        <div class="note-detail__content markdown" data-md>${RS.renderMarkdown(md)}</div>
      </div>`;

    const mdEl = root.querySelector('[data-md]');
    highlight(mdEl);

    // 插入 TOC
    const body = root.querySelector('.note-detail__body');
    const tocNav = buildTOC(mdEl);
    if (tocNav) {
      body.insertBefore(tocNav, body.firstChild);
      bindScrollSpy(mdEl, tocNav);
    }

    // 平滑锚点
    mdEl.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = mdEl.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
