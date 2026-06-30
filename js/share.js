/* ============================================================
   RS NOTES · share.js
   分享页：时间轴 + 图片瀑布流 + 灯箱预览 + 搜索
   数据：data/share/index.json  →  { items: [...] }
   ============================================================ */

(function () {
  let ALL_ITEMS = [];

  function timelineHTML(items) {
    if (!items.length) {
      return `<div class="state-empty"><h3>暂无动态</h3><p>还没有分享内容。</p></div>`;
    }
    return items.map(item => {
      const imgs = (item.images || []).map((src, i) =>
        `<div class="masonry__item" data-img="${RS.escape(src)}" data-cap="${RS.escape(item.title)}">
           <img src="${RS.escape(src)}" alt="${RS.escape(item.title)} ${i + 1}" loading="lazy" />
           <div class="masonry__cap">${RS.escape(item.title)}</div>
         </div>`
      ).join('');
      return `
        <div class="tl-item reveal" id="${RS.escape(item.id)}">
          <div class="tl-date">${RS.escape(item.date || '')}</div>
          <h3 class="tl-title">${RS.escape(item.title)}</h3>
          <p class="tl-text">${RS.escape(item.text || '')}</p>
          ${imgs ? `<div class="masonry" style="margin-top:18px;">${imgs}</div>` : ''}
        </div>`;
    }).join('');
  }

  function bindLightbox() {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    const lbCap = document.getElementById('lightboxCaption');
    const lbClose = document.getElementById('lightboxClose');
    if (!lb) return;

    document.querySelector('[data-timeline]').addEventListener('click', (e) => {
      const item = e.target.closest('[data-img]');
      if (!item) return;
      lbImg.src = item.dataset.img;
      lbCap.textContent = item.dataset.cap || '';
      lb.classList.add('is-open');
    });
    const close = () => lb.classList.remove('is-open');
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  function bindSearch() {
    const input = document.getElementById('shareSearch');
    if (!input) return;
    input.addEventListener('input', RS.debounce(() => {
      const q = input.value.trim().toLowerCase();
      const filtered = q
        ? ALL_ITEMS.filter(i =>
            (i.title || '').toLowerCase().includes(q) ||
            (i.text || '').toLowerCase().includes(q))
        : ALL_ITEMS;
      const tl = document.querySelector('[data-timeline]');
      tl.innerHTML = timelineHTML(filtered);
      RS.observeReveals();
    }, 150));
  }

  async function init() {
    RS.observeReveals();
    const idx = await RS.fetchJSON('data/share/index.json', { items: [] });
    ALL_ITEMS = (idx.items || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const tl = document.querySelector('[data-timeline]');
    tl.innerHTML = timelineHTML(ALL_ITEMS);
    RS.observeReveals();
    bindLightbox();
    bindSearch();

    // 锚点跳转
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
