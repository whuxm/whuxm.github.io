/* ============================================================
   RS NOTES · notes.js
   笔记页：标签云 + 文章列表 + 搜索 + 阅读统计展示
   数据：notes/index.json  →  { notes: [...] }
   ============================================================ */

(function () {
  let ALL_NOTES = [];
  let activeTag = 'all';
  let activeQuery = '';

  function tagCloudHTML(tagMap) {
    const entries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]);
    let html = `<button class="tag is-active" data-tag="all">全部<span class="tagcloud__count">${ALL_NOTES.length}</span></button>`;
    html += entries.map(([tag, count]) =>
      `<button class="tag" data-tag="${RS.escape(tag)}">${RS.escape(tag)}<span class="tagcloud__count">${count}</span></button>`
    ).join('');
    return html;
  }

  function buildTagMap() {
    const map = {};
    ALL_NOTES.forEach(n => (n.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; }));
    return map;
  }

  function noteItemHTML(n) {
    const views = RS.getViewCount(n.id);
    const tags = (n.tags || []).map(t => `<span class="tag">${RS.escape(t)}</span>`).join('');
    return `
      <a class="note-item" href="notes/article.html?id=${encodeURIComponent(n.id)}">
        <h3 class="note-item__title">${RS.escape(n.title)}</h3>
        <p class="note-item__summary">${RS.escape(n.summary || '')}</p>
        <div class="note-item__meta">
          <span>📅 ${RS.escape(n.date || '')}</span>
          <span>👁 ${views} views</span>
          <div class="card__tags" style="margin-left:auto;">${tags}</div>
        </div>
      </a>`;
  }

  function render() {
    const list = document.querySelector('[data-notes-list]');
    if (!list) return;
    let filtered = ALL_NOTES;
    if (activeTag !== 'all') filtered = filtered.filter(n => (n.tags || []).includes(activeTag));
    if (activeQuery) {
      const q = activeQuery.toLowerCase();
      filtered = filtered.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.summary || '').toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (!filtered.length) {
      list.innerHTML = `<div class="notes-empty"><p class="muted">没有匹配的笔记。</p></div>`;
      return;
    }
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.innerHTML = filtered.map(noteItemHTML).join('');
  }

  function bind() {
    const cloud = document.querySelector('[data-tagcloud]');
    cloud.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tag]');
      if (!btn) return;
      cloud.querySelectorAll('.tag').forEach(t => t.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeTag = btn.dataset.tag;
      render();
    });

    const search = document.getElementById('notesSearch');
    if (search) {
      search.addEventListener('input', RS.debounce(() => {
        activeQuery = search.value.trim();
        render();
      }, 150));
    }
  }

  async function init() {
    RS.observeReveals();
    const idx = await RS.fetchJSON('notes/index.json', { notes: [] });
    ALL_NOTES = idx.notes || [];
    const cloud = document.querySelector('[data-tagcloud]');
    if (cloud) cloud.innerHTML = tagCloudHTML(buildTagMap());
    render();
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
