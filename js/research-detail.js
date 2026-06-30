/* ============================================================
   RS NOTES · research-detail.js
   科研详情页：从 index.json 读取项目 → Marked + KaTeX + Prism 渲染
   ============================================================ */

(function () {
  const STATUS_LABEL = { ongoing: '进行中', completed: '已完成', planning: '规划中' };

  function highlight(container) {
    if (typeof Prism !== 'undefined') Prism.highlightAllUnder(container);
  }

  async function init() {
    const id = RS.getQuery('id');
    const root = document.querySelector('[data-project-content]');
    if (!id) {
      root.innerHTML = `<div class="state-empty"><h3>缺少项目 ID</h3><p><a href="../research.html">返回科研页</a></p></div>`;
      return;
    }

    const idx = await RS.fetchJSON(RS.url('data/research/index.json'), { projects: [] });
    const projects = idx.projects || [];
    const project = projects.find(p => p.id === id);

    if (!project) {
      root.innerHTML = `<div class="state-empty"><h3>未找到该项目</h3><p><a href="../research.html">返回科研页</a></p></div>`;
      return;
    }

    document.title = `${project.title} · RS NOTES`;

    const tags = (project.tags || []).map(t => `<span class="tag">${RS.escape(t)}</span>`).join('');
    root.innerHTML = `
      <span class="eyebrow">${RS.escape((project.status || '').toUpperCase())} · ${RS.escape(project.date || '')}</span>
      <h1>${RS.escape(project.title)}</h1>
      <p style="margin-top:18px;max-width:640px;font-size:1.05rem;">${RS.escape(project.intro || '')}</p>
      ${project.cover ? `<div class="project-hero__cover"><img src="${project.cover}" alt="${RS.escape(project.title)}" /></div>` : ''}
      <div class="project-meta">
        <div class="project-meta__item"><span class="eyebrow">Status</span><span class="value">${RS.escape(STATUS_LABEL[project.status] || project.status || '')}</span></div>
        <div class="project-meta__item"><span class="eyebrow">Date</span><span class="value">${RS.escape(project.date || '')}</span></div>
        <div class="project-meta__item"><span class="eyebrow">Tags</span><span class="value">${(project.tags || []).join(' · ') || '—'}</span></div>
        <div class="project-meta__item"><span class="eyebrow">ID</span><span class="value mono">${RS.escape(project.id)}</span></div>
      </div>
      <div class="card__tags" style="margin-bottom:32px;">${tags}</div>
      <div class="markdown" data-md>${RS.renderMarkdown(project.content)}</div>`;

    const md = root.querySelector('[data-md]');
    highlight(md);
    RS.observeReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
