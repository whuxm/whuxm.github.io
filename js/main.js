/* ============================================================
   RS NOTES · main.js
   全站入口：配置注入、导航、页脚、滚动状态、搜索触发
   ============================================================ */

(function () {
  const cfg = window.SITE_CONFIG || {};

  /* ---------- 图标库（内联 SVG，避免外部依赖） ---------- */
  const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 19c-4 1.4-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6.2a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6.2 0C6.7 2.4 5.7 2.7 5.7 2.7a4.5 4.5 0 0 0-.1 3.3A4.8 4.8 0 0 0 4.3 9.3c0 4.8 2.7 5.9 5.5 6.2-.6.6-.6 1.2-.5 2V21"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14"/><path d="m3 7 9 6 9-6"/></svg>',
    rss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/></svg>',
    burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  };
  window.RS_ICONS = ICONS;

  function icon(name) { return ICONS[name] || ''; }

  /* ---------- 注入导航 ---------- */
  function renderNav() {
    const nav = document.querySelector('[data-nav]');
    if (!nav) return;
    const path = location.pathname;
    const menuHTML = (cfg.nav || []).map(item => {
      const stem = (item.url || '').replace(/\.html$/, '');
      const isActive = path.includes('/' + stem + '.html') || path.includes('/' + stem + '/');
      const active = isActive ? ' is-active' : '';
      return `<a class="nav__link${active}" href="${window.RS ? RS.url(item.url) : item.url}">${item.name}</a>`;
    }).join('');

    const brandHref = window.RS ? RS.url('index.html') : 'index.html';
    const logoSrc = window.RS ? RS.url(cfg.logo || 'assets/logo.svg') : (cfg.logo || 'assets/logo.svg');
    // 当前主题决定按钮图标：浅色显示月亮（切回深色），深色显示太阳（切到浅色）
    const themeIcon = icon(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun');
    nav.innerHTML = `
      <div class="nav__inner">
        <a class="nav__brand" href="${brandHref}" aria-label="${cfg.title || 'Home'}">
          <img src="${logoSrc}" alt="logo" />
          <span class="nav__brand-text">${cfg.title || ''}</span>
        </a>
        <nav class="nav__menu" id="navMenu">${menuHTML}</nav>
        <div class="nav__spacer"></div>
        <div class="nav__tools">
          <button class="icon-btn" id="themeToggle" aria-label="切换主题" title="切换深/浅色">${themeIcon}</button>
          <button class="icon-btn" id="searchTrigger" aria-label="Search">${icon('search')}</button>
          <button class="icon-btn nav__burger" id="navBurger" aria-label="Menu">${icon('burger')}</button>
        </div>
      </div>`;
  }

  /* ---------- 注入页脚 ---------- */
  function renderFooter() {
    const footer = document.querySelector('[data-footer]');
    if (!footer) return;
    const hasRS = !!window.RS;
    const logoSrc = hasRS ? RS.url(cfg.logo || 'assets/logo.svg') : (cfg.logo || 'assets/logo.svg');
    const social = (cfg.social || []).map(s =>
      `<a class="icon-btn" href="${hasRS ? RS.url(s.url) : s.url}" target="_blank" rel="noopener" aria-label="${s.name}">${icon(s.icon) || icon('link')}</a>`
    ).join('');
    footer.innerHTML = `
      <div class="container footer__inner">
        <div class="footer__brand">
          <img src="${logoSrc}" alt="logo" />
          <div>
            <div style="font-family:var(--font-display);font-size:1.1rem;">${cfg.title || ''}</div>
            <div class="footer__meta">${cfg.subtitle || ''}</div>
          </div>
        </div>
        <div class="footer__social">${social}</div>
      </div>`;
  }

  /* ---------- 导航交互 ---------- */
  function bindNav() {
    const onScroll = () => {
      const nav = document.querySelector('.nav');
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const burger = document.getElementById('navBurger');
    const menu = document.getElementById('navMenu');
    if (burger && menu) {
      burger.addEventListener('click', () => menu.classList.toggle('is-open'));
    }
  }

  /* ---------- 搜索触发 ---------- */
  function bindSearchTrigger() {
    const trigger = document.getElementById('searchTrigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      if (window.RS_SEARCH) window.RS_SEARCH.open();
    });
    // 快捷键 / 或 Cmd/Ctrl+K
    document.addEventListener('keydown', (e) => {
      if (window.RS_SEARCH && window.RS_SEARCH.isOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.RS_SEARCH.open();
      } else if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault();
        window.RS_SEARCH.open();
      }
    });
  }

  /* ---------- 主题切换（深/浅色） ----------
     主题状态保存在 localStorage 的 'rs-theme' 键；
     <html data-theme="light|dark"> 由各 HTML 头部内联脚本提前设置，避免闪烁。
     此处仅负责按钮交互、切换与持久化。 */
  function bindThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const apply = () => {
      const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('rs-theme', next); } catch (e) {}
      btn.innerHTML = icon(next === 'light' ? 'moon' : 'sun');
      btn.setAttribute('aria-label', next === 'light' ? '切换到深色' : '切换到浅色');
    };
    btn.addEventListener('click', apply);
  }

  /* ---------- 启动 ---------- */
  function init() {
    renderNav();
    renderFooter();
    bindNav();
    bindSearchTrigger();
    bindThemeToggle();
    if (window.RS) RS.observeReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
