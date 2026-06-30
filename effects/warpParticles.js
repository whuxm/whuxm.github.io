/* ============================================================
   RS NOTES · warpParticles.js
   中心爆发式粒子动效（warp speed starfield）
   ------------------------------------------------------------
   [MODIFIED] 重写：从「开关式」改为与原 Three.js 粒子网络互切。
   - 画布与切换按钮均挂载到 .hero 内（仅首页第一屏）
   - 模式状态机：'network'（默认，显示 Three.js 网络）| 'warp'（显示跃迁粒子）
   - 通过 .hero.is-warp 类切换 CSS opacity，平滑淡入淡出
   - 状态持久化（localStorage: rs-warp）
   - Canvas 2D + requestAnimationFrame + Retina 适配
   - IntersectionObserver 离开首屏暂停
   - 主题切换时自动更新粒子颜色
   对 particles.js 零改动：warp 模式下 Three.js 仍运行但 opacity:0 不可见。
   ============================================================ */

(function () {
  'use strict';

  const hero = document.querySelector('.hero');
  if (!hero) return;                 // 仅首页有 .hero；其他页面直接退出

  /* ====== 无障碍：减少动效时不启用 ====== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ====== 配置参数（均可按需调整） ====== */
  const CONFIG = {
    particleCount: 320,       // 【可改】粒子数量
    zMax: 200,               // 【可改】最大深度（粒子起始 z）
    zMin: 1,                  // 【可改】最小深度（到达后重置）
    baseSpeed: 0.1,             // 【可改】基础速度（z 每帧减少量）
    sizeScale: 0.02,          // 【可改】粒子线宽缩放（越大条纹越粗）
    perturb: 0.0025,          // 【可改】方向随机扰动幅度
    storageKey: 'rs-warp'     // 【可改】localStorage 持久化键名
  };

  /* ====== 创建画布（挂载到 .hero） ====== */
  const canvas = document.createElement('canvas');
  canvas.className = 'warp-canvas';
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  /* ====== 运行时状态 ====== */
  let W = 0, H = 0, cx = 0, cy = 0, focal = 0, dpr = 1;
  let particles = [];
  let mode = 'network';          // 'network' | 'warp'
  let rafId = null;
  let inViewport = true;
  let fgColor = '#fafafa';

  /* ====== 读取前景色（跟随主题变量 --fg） ====== */
  function readColor() {
    const c = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
    if (c) fgColor = c;
  }
  readColor();
  new MutationObserver(readColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  /* ====== 粒子类 ====== */
  function Particle(initial) {
    this.x = (Math.random() - 0.5) * 1.6;   // 方向向量 x ∈ [-0.8, 0.8]
    this.y = (Math.random() - 0.5) * 1.6;   // 方向向量 y ∈ [-0.8, 0.8]
    this.z = initial ? Math.random() * CONFIG.zMax : CONFIG.zMax;
    this.speed = 0.7 + Math.random() * 0.6; // 个体速度差异
    this.px = 0;
    this.py = 0;
    this.firstFrame = true;                 // 重置后首帧不绘制（避免从中心拉线）
  }
  Particle.prototype.reset = function () {
    this.x = (Math.random() - 0.5) * 1.6;
    this.y = (Math.random() - 0.5) * 1.6;
    this.z = CONFIG.zMax;
    this.speed = 0.7 + Math.random() * 0.6;
    this.firstFrame = true;
  };

  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(new Particle(true));
    }
  }

  /* ====== 尺寸适配（Retina，基于 hero 尺寸） ====== */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || hero.clientWidth || window.innerWidth;
    H = canvas.clientHeight || hero.clientHeight || window.innerHeight;
    cx = W / 2;
    cy = H / 2;
    focal = Math.max(W, H);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ====== 动画循环 ====== */
  function tick() {
    if (mode !== 'warp' || !inViewport) { rafId = null; return; }

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = fgColor;
    ctx.lineCap = 'round';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 速度随距离衰减：z 越小（离中心越远）速度越慢
      const distFactor = 0.35 + 0.65 * (p.z / CONFIG.zMax);
      p.z -= CONFIG.baseSpeed * p.speed * distFactor;

      // 方向随机扰动（轻微抖动）
      p.x += (Math.random() - 0.5) * CONFIG.perturb;
      p.y += (Math.random() - 0.5) * CONFIG.perturb;

      // 到达近端 → 重置到远端
      if (p.z <= CONFIG.zMin) { p.reset(); continue; }

      // 透视投影到屏幕坐标
      const sx = cx + (p.x / p.z) * focal;
      const sy = cy + (p.y / p.z) * focal;

      // 重置后首帧只记录位置，不绘制
      if (p.firstFrame) {
        p.firstFrame = false;
        p.px = sx;
        p.py = sy;
        continue;
      }

      const alpha = Math.max(0.05, 1 - p.z / CONFIG.zMax);
      const lw = Math.max(0.3, (CONFIG.zMax / p.z) * CONFIG.sizeScale);

      ctx.globalAlpha = alpha;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      p.px = sx;
      p.py = sy;
    }

    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(tick);
  }

  function startRaf() {
    if (prefersReducedMotion) return;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function stopRaf() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ====== 模式切换 ====== */
  function setMode(next) {
    mode = next;
    if (mode === 'warp') {
      hero.classList.add('is-warp');
      if (inViewport) startRaf();
    } else {
      hero.classList.remove('is-warp');
      stopRaf();
      // 淡出后清除画布
      setTimeout(function () {
        if (mode !== 'warp') ctx.clearRect(0, 0, W, H);
      }, 800);
    }
    try { localStorage.setItem(CONFIG.storageKey, mode); } catch (e) {}
    updateButton();
  }

  /* ====== 切换按钮（挂载到 .hero） ====== */
  // network 图标：点阵网络
  var ICON_NETWORK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">' +
    '<circle cx="5" cy="6" r="1.3" fill="currentColor"/>' +
    '<circle cx="12" cy="4" r="1.3" fill="currentColor"/>' +
    '<circle cx="19" cy="7" r="1.3" fill="currentColor"/>' +
    '<circle cx="7" cy="14" r="1.3" fill="currentColor"/>' +
    '<circle cx="15" cy="13" r="1.3" fill="currentColor"/>' +
    '<circle cx="18" cy="18" r="1.3" fill="currentColor"/>' +
    '<path d="M5 6 12 4 19 7 15 13 7 14 5 6M15 13 18 18M7 14 18 18"/>' +
    '</svg>';
  // warp 图标：星芒放射
  var ICON_WARP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">' +
    '<circle cx="12" cy="12" r="1.4" fill="currentColor"/>' +
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>' +
    '</svg>';

  var btn = document.createElement('button');
  btn.className = 'warp-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', '切换粒子特效');
  btn.title = '切换粒子特效（网络 / 跃迁）';
  hero.appendChild(btn);

  function updateButton() {
    if (mode === 'warp') {
      btn.classList.add('is-active');
      btn.innerHTML = ICON_WARP;
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('is-active');
      btn.innerHTML = ICON_NETWORK;
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  btn.addEventListener('click', function () {
    setMode(mode === 'warp' ? 'network' : 'warp');
  });

  /* ====== 离开首屏暂停（仅 warp 模式需要；network 由 particles.js 自管） ====== */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        inViewport = e.isIntersecting;
        if (mode === 'warp') {
          if (inViewport) startRaf();
          else stopRaf();
        }
      });
    });
    io.observe(hero);
  }

  /* ====== 初始化 ====== */
  resize();
  initParticles();
  window.addEventListener('resize', resize);

  // 标签页隐藏时暂停（节省资源）
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopRaf();
    else if (mode === 'warp' && inViewport) startRaf();
  });

  // 读取持久化状态（默认 network）
  var saved = null;
  try { saved = localStorage.getItem(CONFIG.storageKey); } catch (e) {}
  // 兼容上一版 'on'/'off' 值：'on' 视为 'warp'，其他视为 'network'
  setMode(saved === 'warp' || saved === 'on' ? 'warp' : 'network');
})();
