/* ============================================================
   RS NOTES · research.js
   科研页：项目墙渲染 + 状态筛选
   数据：data/research/index.json  →  { projects: [...] }
   ============================================================ */

(function () {
  const STATUS_LABEL = { ongoing: '进行中', completed: '已完成', planning: '规划中' };

  function cardHTML(p) {
    const tags = (p.tags || []).map(t => `<span class="tag">${RS.escape(t)}</span>`).join('');
    return `
      <a class="card reveal" href="research/project.html?id=${encodeURIComponent(p.id)}">
        <div class="card__cover">
          ${p.cover ? `<img src="${p.cover}" alt="${RS.escape(p.title)}" loading="lazy" />` : ''}
        </div>
        <div class="card__corner">${RS.escape((p.status || '').toUpperCase())}</div>
        <div class="card__body">
          <div class="card__meta">
            <span class="status status--${RS.escape(p.status || 'planning')}">
              <span class="status__dot"></span>${RS.escape(STATUS_LABEL[p.status] || p.status || '')}
            </span>
            <span class="card__date">${RS.escape(p.date || '')}</span>
          </div>
          <h3 class="card__title">${RS.escape(p.title)}</h3>
          <p class="card__intro">${RS.escape(p.intro || '')}</p>
          <div class="card__tags">${tags}</div>
        </div>
      </a>`;
  }

  function render(projects, filter = 'all') {
    const grid = document.querySelector('[data-research-grid]');
    if (!grid) return;
    const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);
    if (!filtered.length) {
      grid.innerHTML = `<div class="state-empty" style="grid-column:1/-1;"><h3>暂无项目</h3><p>该分类下还没有内容。</p></div>`;
      return;
    }
    grid.innerHTML = filtered.map(cardHTML).join('');
    RS.observeReveals();
  }

  function bindFilters(projects) {
    const filters = document.querySelector('[data-filters]');
    if (!filters) return;
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filters.querySelectorAll('.tag').forEach(t => t.classList.remove('is-active'));
      btn.classList.add('is-active');
      render(projects, btn.dataset.filter);
    });
  }

  async function init() {
    RS.observeReveals();
    const idx = await RS.fetchJSON('data/research/index.json', { projects: [] });
    const projects = idx.projects || [];
    render(projects);
    bindFilters(projects);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
