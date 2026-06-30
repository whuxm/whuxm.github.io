/* ============================================================
   RS NOTES · particles.js
   Three.js 粒子网络背景：黑底白点 + 近距离连线 + 鼠标视差
   关键：粒子位置以「归一化坐标 [-1,1]」存储，每帧映射到
        当前相机可视视锥的真实尺寸，保证任意宽高比下都铺满全屏。
   依赖：Three.js（全局 THREE，由 HTML 通过 CDN 引入）
   ============================================================ */

(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    if (canvas) canvas.style.display = 'none';
    return;
  }

  /* ===== 读取站点配置（SITE_CONFIG.hero.particles）=====
     所有数值都可在 config/site.config.js 中调整，无需改这里。 */
  const cfg = (window.SITE_CONFIG && window.SITE_CONFIG.hero && window.SITE_CONFIG.hero.particles) || {};
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  // 【粒子数量】越小越疏散；移动端默认更少以保证性能
  const COUNT = isMobile ? (cfg.countMobile || 26) : (cfg.count || 80);
  // 【连线距离】归一化 0~1，0=无连线，越大连线越密（移动端默认关闭连线）
  const LINK_NORM = isMobile ? 0 : (cfg.linkDistance != null ? cfg.linkDistance : 0.13);
  const PARTICLE_COLOR = new THREE.Color(cfg.color || '#ffffff');
  const PARTICLE_SIZE = cfg.size || 2.4;
  const PARTICLE_OPACITY = cfg.opacity != null ? cfg.opacity : 0.85;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
  camera.position.z = 320;

  /* ---------- 归一化位置 [-1,1]，速度归一化 ---------- */
  const nx = new Float32Array(COUNT);
  const ny = new Float32Array(COUNT);
  const nz = new Float32Array(COUNT);
  const vx = new Float32Array(COUNT);
  const vy = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    nx[i] = Math.random() * 2 - 1;
    ny[i] = Math.random() * 2 - 1;
    nz[i] = Math.random() * 2 - 1;
    vx[i] = (Math.random() - 0.5) * 0.0011;   // 【可改】粒子漂移速度
    vy[i] = (Math.random() - 0.5) * 0.0011;
  }

  const positions = new Float32Array(COUNT * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: PARTICLE_COLOR,
    size: isMobile ? PARTICLE_SIZE + 0.4 : PARTICLE_SIZE,
    transparent: true,
    opacity: PARTICLE_OPACITY,
    sizeAttenuation: true,
    depthWrite: false
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- 可视视锥真实边界（每帧/resize 重新计算） ---------- */
  let halfW = 200, halfH = 200, depth = 140;
  const margin = 1.12; // 略微超出边界，避免边缘留白

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vFOV = camera.fov * Math.PI / 180;
    halfH = Math.tan(vFOV / 2) * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  resize();

  /* ---------- 连线 ---------- */
  let lineSeg = null;
  if (LINK_NORM > 0) {
    const maxLinks = Math.floor(COUNT * (COUNT - 1) / 2);
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxLinks * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false
    });
    lineSeg = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSeg);
  }

  /* ---------- 鼠标视差 ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---------- 主循环 ---------- */
  let raf;
  const linkMax2 = (LINK_NORM * 2) * (LINK_NORM * 2);

  function tick() {
    for (let i = 0; i < COUNT; i++) {
      nx[i] += vx[i];
      ny[i] += vy[i];
      if (nx[i] > 1) nx[i] = -1; else if (nx[i] < -1) nx[i] = 1;
      if (ny[i] > 1) ny[i] = -1; else if (ny[i] < -1) ny[i] = 1;

      positions[i * 3]     = nx[i] * halfW * margin;
      positions[i * 3 + 1] = ny[i] * halfH * margin;
      positions[i * 3 + 2] = nz[i] * depth;
    }
    pGeo.attributes.position.needsUpdate = true;

    if (lineSeg) {
      const lp = lineSeg.geometry.attributes.position.array;
      let li = 0;
      for (let i = 0; i < COUNT; i++) {
        const ax = nx[i], ay = ny[i];
        for (let j = i + 1; j < COUNT; j++) {
          const dx = ax - nx[j];
          const dy = ay - ny[j];
          if (dx * dx + dy * dy < linkMax2) {
            const ix = i * 3, jx = j * 3;
            lp[li++] = positions[ix];     lp[li++] = positions[ix + 1]; lp[li++] = positions[ix + 2];
            lp[li++] = positions[jx];     lp[li++] = positions[jx + 1]; lp[li++] = positions[jx + 2];
          }
        }
      }
      lineSeg.geometry.setDrawRange(0, li / 3);
      lineSeg.geometry.attributes.position.needsUpdate = true;
    }

    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    camera.position.x = mouse.x * halfW * 0.1;
    camera.position.y = -mouse.y * halfH * 0.1;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  /* ---------- 可见性优化：离开视口暂停 ---------- */
  const heroEl = document.querySelector('.hero');
  if (heroEl && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(tick); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    });
    io.observe(heroEl);
  } else {
    raf = requestAnimationFrame(tick);
  }

  /* ---------- 响应式 ---------- */
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 150);
  });
})();
