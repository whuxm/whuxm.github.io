/* ============================================================
   RS NOTES · search.js
   全站统一搜索：毛玻璃展开 · 实时筛选 · Esc 关闭
   数据源：data/research、notes/index.json、data/share/index.json
   ============================================================ */

(function () {
  const SEARCH = {
    isOpen: false,
    data: { research: [], notes: [], share: [] },
    loaded: false,
    el: null, input: null, results: null,

    init() {
      // 构建 DOM
      const el = document.createElement('div');
      el.className = 'search';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false');
      el.innerHTML = `
        <div class="search__bar">
          <div class="search__input-wrap">
            <span class="search__icon">${(window.RS_ICONS && window.RS_ICONS.search) || ''}</span>
            <input class="search__input" type="text" placeholder="搜索科研 / 笔记 / 分享…" autocomplete="off" spellcheck="false" />
            <span class="search__close" id="searchClose">ESC</span>
          </div>
        </div>
        <div class="search__results" id="searchResults"></div>`;
      document.body.appendChild(el);
      this.el = el;
      this.input = el.querySelector('.search__input');
      this.results = el.querySelector('#searchResults');

      this.input.addEventListener('input', RS.debounce(() => this.filter(this.input.value), 120));
      el.querySelector('#searchClose').addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) { e.preventDefault(); this.close(); }
      });
      el.querySelector('.search__bar').addEventListener('click', (e) => {
        if (e.target === el.querySelector('.search__bar')) this.close();
      });
    },

    async ensureData() {
      if (this.loaded) return;
      this.loaded = true;
      const [researchIdx, notesIdx, shareIdx] = await Promise.all([
        RS.fetchJSON(RS.url('data/research/index.json'), { projects: [] }),
        RS.fetchJSON(RS.url('notes/index.json'), { notes: [] }),
        RS.fetchJSON(RS.url('data/share/index.json'), { items: [] })
      ]);
      this.data.research = (researchIdx.projects || researchIdx || []).map(p => ({
        type: 'research',
        id: p.id,
        title: p.title,
        snippet: p.intro || '',
        tags: (p.tags || []).join(' '),
        url: RS.url('research/project.html') + `?id=${p.id}`
      }));
      this.data.notes = (notesIdx.notes || []).map(n => ({
        type: 'notes',
        id: n.id,
        title: n.title,
        snippet: n.summary || '',
        tags: (n.tags || []).join(' '),
        url: RS.url('notes/article.html') + `?id=${n.id}`
      }));
      this.data.share = (shareIdx.items || []).map(s => ({
        type: 'share',
        id: s.id,
        title: s.title,
        snippet: s.text || '',
        tags: '',
        url: RS.url('share.html') + `#${s.id}`
      }));
    },

    open() {
      if (!this.el) this.init();
      this.isOpen = true;
      this.el.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      // 展开动画完成后聚焦
      setTimeout(() => this.input && this.input.focus(), 280);
      this.ensureData();
    },

    close() {
      this.isOpen = false;
      this.el.classList.remove('is-open');
      document.body.style.overflow = '';
      if (this.input) this.input.value = '';
      // [MODIFIED] 延迟清空结果，让面板有时间淡出（与 CSS 0.3s 过渡匹配）
      setTimeout(() => { if (!this.isOpen && this.results) this.results.innerHTML = ''; }, 320);
    },

    filter(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) { this.results.innerHTML = ''; return; }
      const all = [...this.data.research, ...this.data.notes, ...this.data.share];
      const matches = all.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.snippet && item.snippet.toLowerCase().includes(q)) ||
        (item.tags && item.tags.toLowerCase().includes(q))
      ).slice(0, 24);

      if (!matches.length) {
        this.results.innerHTML = `<div class="search__empty">未找到与 “${RS.escape(q)}” 相关的内容</div>`;
        return;
      }

      const groups = { research: [], notes: [], share: [] };
      matches.forEach(m => groups[m.type].push(m));
      const labels = { research: 'Research · 科研', notes: 'Notes · 笔记', share: 'Share · 分享' };

      let html = '';
      for (const key of ['research', 'notes', 'share']) {
        if (!groups[key].length) continue;
        html += `<div class="search__group"><div class="search__group-label">${labels[key]}</div>`;
        html += groups[key].map(m => `
          <a class="search__item" href="${m.url}">
            <span class="search__item-title">${RS.highlight(m.title, q)}</span>
            ${m.snippet ? `<span class="search__item-snippet">${RS.highlight(m.snippet.slice(0, 90), q)}</span>` : ''}
          </a>`).join('');
        html += `</div>`;
      }
      this.results.innerHTML = html;
    }
  };

  window.RS_SEARCH = SEARCH;
})();
