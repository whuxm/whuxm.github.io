/* ============================================================
   RS NOTES · home.js
   首页：GSAP Hero 入场动画 + 第二屏入口预览加载
   ============================================================ */

(function () {
  /* ---------- 应用首屏背景图（读取 SITE_CONFIG.hero.background）---------- */
  function applyHeroBackground() {
    const bg = (window.SITE_CONFIG && window.SITE_CONFIG.hero && window.SITE_CONFIG.hero.background) || {};
    if (!bg.image) return;                // 未配置背景图则使用默认渐变
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // 背景图层：opacity / blur 由配置控制
    const img = document.createElement('div');
    img.className = 'hero__bg-img';
    img.style.backgroundImage = `url("${bg.image}")`;
    img.style.opacity = bg.opacity != null ? bg.opacity : 0.35;
    if (bg.blur) img.style.filter = `blur(${bg.blur}px)`;
    hero.insertBefore(img, hero.firstChild);

    // 可选暗色遮罩，保证文字可读
    if (bg.overlay) {
      const overlay = document.createElement('div');
      overlay.className = 'hero__bg-overlay';
      hero.insertBefore(overlay, img.nextSibling);
    }
  }

  /* ---------- Hero 入场动画 ---------- */
  function heroIntro() {
    if (typeof gsap === 'undefined') {
      // 降级：直接显示
      document.querySelectorAll('[data-hero-avatar],[data-hero-eyebrow],[data-hero-title],[data-hero-tagline],[data-hero-cta]').forEach(el => { el.style.opacity = 1; });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    gsap.set('[data-hero-avatar],[data-hero-eyebrow],[data-hero-title],[data-hero-tagline],[data-hero-cta]', { opacity: 0 });

    tl.fromTo('[data-hero-avatar]',   { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
      .fromTo('[data-hero-eyebrow]',  { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.5')
      .fromTo('[data-hero-title]',    { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, '-=0.4')
      .fromTo('[data-hero-tagline]',  { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
      .fromTo('[data-hero-cta]',      { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
      .fromTo('.hero__scroll',        { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3');
  }

  /* ---------- 第二屏入口预览 ---------- */
  async function loadPreviews() {
    const [researchIdx, notesIdx, shareIdx] = await Promise.all([
      RS.fetchJSON('data/research/index.json', { projects: [] }),
      RS.fetchJSON('notes/index.json', { notes: [] }),
      RS.fetchJSON('data/share/index.json', { items: [] })
    ]);

    // Research 预览：最近 2 个项目
    const researchPreview = document.querySelector('[data-entry-preview="research"]');
    if (researchPreview) {
      const projects = (researchIdx.projects || []).slice(0, 2);
      researchPreview.innerHTML = projects.length
        ? projects.map(p => `
            <div class="entry__preview-row">
              <span>${RS.escape(p.title)}</span>
              <span>${RS.escape(p.date || '')} · ${RS.escape((p.status || '').toUpperCase())}</span>
            </div>`).join('')
        : `<div class="entry__preview-row"><span>暂无项目</span><span>—</span></div>`;
    }

    // Notes 预览：最近 2 篇 + 阅读量
    const notesPreview = document.querySelector('[data-entry-preview="notes"]');
    if (notesPreview) {
      const notes = (notesIdx.notes || []).slice(0, 2);
      notesPreview.innerHTML = notes.length
        ? notes.map(n => {
            const views = RS.getViewCount(n.id);
            return `<div class="entry__preview-row">
              <span>${RS.escape(n.title)}</span>
              <span>${RS.escape(n.date || '')} · ${views} views</span>
            </div>`;
          }).join('')
        : `<div class="entry__preview-row"><span>暂无笔记</span><span>—</span></div>`;
    }

    // Share 预览：最近 2 条动态
    const sharePreview = document.querySelector('[data-entry-preview="share"]');
    if (sharePreview) {
      const items = (shareIdx.items || []).slice(0, 2);
      sharePreview.innerHTML = items.length
        ? items.map(s => `
            <div class="entry__preview-row">
              <span>${RS.escape(s.title)}</span>
              <span>${RS.escape(s.date || '')}</span>
            </div>`).join('')
        : `<div class="entry__preview-row"><span>暂无动态</span><span>—</span></div>`;
    }
  }

  function init() {
    applyHeroBackground();   // 先注入背景图，再做入场动画
    heroIntro();
    if (window.RS) RS.observeReveals();
    loadPreviews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
