# Astro 迁移剩余阶段执行方案（阶段 5–9）

## 摘要

本文档承接已批准的《Astro 架构迁移方案》，覆盖剩余工作：完成最后一个组件 `HeroParticles.astro`，创建 3 个布局、6 个页面、1 个脚本模块与 1 个搜索端点，最后构建验证并清理旧文件。执行完毕后，项目将完全运行在 Astro 5 + Content Collections 架构上。

---

## 当前状态分析

### 已完成
- **阶段 1（项目初始化）**：`package.json`、`astro.config.mjs`、`tsconfig.json`，依赖已安装
- **阶段 2（内容迁移）**：`src/content/config.ts`（3 个 zod schema）+ 4 篇 research + 4 篇 notes + 4 篇 share 的 `.md`，10 张图片已下载到 `public/`
- **阶段 3（配置系统）**：`src/config/site.ts`、`src/config/home.ts`
- **阶段 4（样式系统）**：7 个 CSS 文件（theme/typography/global/components/pages/markdown/warpParticles）
- **阶段 5（组件，7/8）**：Icon、Navbar、Footer、SearchBox、ProjectCard、NoteCard、ShareCard

### 待完成
- `src/components/HeroParticles.astro` —— 合并 Three.js 粒子网络 + Canvas 2D 跃迁星场
- `src/layouts/BaseLayout.astro`、`PostLayout.astro`、`ResearchLayout.astro`
- `src/pages/index.astro`、`research/index.astro`、`research/[slug].astro`、`notes/index.astro`、`notes/[slug].astro`、`share/index.astro`
- `src/scripts/readingStats.ts`、`src/pages/search-index.json.ts`
- 构建验证 + 旧文件清理

### 关键源文件映射（迁移来源 → 目标）
| 原始文件 | 目标 | 用途 |
|---|---|---|
| `js/particles.js` + `effects/warpParticles.js` | `src/components/HeroParticles.astro` | 首页粒子动效 |
| `js/home.js` | `src/pages/index.astro` `<script>` | Hero 背景/入场/滚动吸附/预览 |
| `js/utils.js`（部分） | `src/scripts/readingStats.ts` | 阅读统计（字数/时长/次数） |
| `js/search.js` | 已迁移到 `SearchBox.astro`，数据源改为 `/search-index.json` | 搜索 |
| `js/research.js` | `src/pages/research/index.astro` `<script>` | 状态筛选 |
| `js/research-detail.js` | `src/pages/research/[slug].astro` | 详情（服务端渲染） |
| `js/notes.js` | `src/pages/notes/index.astro` `<script>` | 标签/搜索筛选 |
| `js/note-detail.js` | `src/pages/notes/[slug].astro` `<script>` | TOC 滚动高亮 + 阅读统计 |
| `js/share.js` | `src/pages/share/index.astro` `<script>` | 搜索 + 灯箱 |

---

## 假设与决策

1. **GSAP 依赖**：用户技术栈文档明确列出 GSAP，原 `home.js` 的 Hero 入场动画依赖 `gsap.timeline`。当前 `package.json` 遗漏了 GSAP，**需补回 `gsap@^3.12.5` 依赖**，在 `index.astro` 中 `import gsap from 'gsap'`。这不改变原动画行为。

2. **KaTeX 样式**：`rehype-katex` 只输出 KaTeX HTML 结构，不包含样式。在 `BaseLayout.astro` 的 `<head>` 中通过 CDN 引入 `katex.min.css`（与原项目一致），不安装 katex npm 包。

3. **阅读统计**：保持 localStorage 键名 `article_views_${slug}`（slug 即原 id）。纯客户端，显示的是本机浏览次数。`readingStats.ts` 导出 `recordView`/`getViewCount`/`countWords`/`estimateReadingTime` 四个函数。

4. **列表页筛选策略**：服务端渲染全部卡片（带 `data-status`/`data-tags` 属性），客户端 JS 通过切换 `display` 筛选，**不再 innerHTML 重建**。比原方案更符合 Astro SSG 模型，且保留 SEO 内容。

5. **笔记 TOC**：使用 Astro 内置 `entry.getHeadings()` 在构建时生成目录 HTML，客户端仅做滚动高亮（IntersectionObserver）与平滑锚点。

6. **首页预览**：原方案运行时 fetch 三个 JSON；Astro 下改为**构建时从 Content Collections 取最近 2 条**直接服务端渲染，零客户端 fetch。笔记预览的阅读量仍由 `readingStats.ts` 客户端补全。

7. **Hero 背景图**：原 `applyHeroBackground()` 运行时注入 div；Astro 下在 `index.astro` 中根据 `home.background` 配置**直接服务端渲染** `.hero__bg-img` 与 `.hero__bg-overlay`。

8. **搜索数据源**：`SearchBox.astro` 已 fetch `/search-index.json`，需创建 `src/pages/search-index.json.ts` 端点，构建时从三个 collection 生成 `{ research[], notes[], share[] }`，URL 分别为 `/research/{slug}`、`/notes/{slug}`、`/share#{slug}`。

9. **路径处理**：Astro 使用根相对路径（`/research` 等），**移除**原 `RS.pathPrefix()` / `RS.url()` 机制。所有 `src`/`href` 直接用 `/` 开头路径或 Astro `<a href={...}>`。

10. **旧文件清理**：构建验证通过后，删除 `index.html`、`research.html`、`notes.html`、`share.html`、`research/`、`notes/`、`css/`、`js/`、`effects/`、`styles/`、`data/`、`config/`、`assets/`、`scripts/`（下载脚本）。保留 `package.json`、`astro.config.mjs`、`tsconfig.json`、`src/`、`public/`、`node_modules/`、`.trae/`。

---

## 提议变更

### 阶段 5（剩余）：`src/components/HeroParticles.astro`

**文件**：`src/components/HeroParticles.astro`（新建）

**模板结构**：
- `<canvas id="particles-canvas" aria-hidden="true"></canvas>` —— Three.js 粒子网络画布
- `<canvas class="warp-canvas" aria-hidden="true"></canvas>` —— Canvas 2D 跃迁星场画布
- `<button class="warp-toggle" type="button" aria-label="切换粒子特效">` —— 切换按钮（用 `Icon.astro` 的 `network`/`warp` 图标）

**脚本逻辑**（合并 `particles.js` + `warpParticles.js`，约 450 行）：
- `import * as THREE from 'three'`（替代全局 THREE）
- 通过 `define:vars` 接收 `home.particles` 配置（count/countMobile/linkDistance/size/opacity/color/colorLight）
- **网络模式**（`particles.js` 迁移）：归一化坐标 `[-1,1]` 存储，每帧映射视锥边界 `halfW/halfH`；圆形粒子贴图（CanvasTexture + radialGradient）；LineSegments 连线（距离平方比较）；鼠标视差相机缓动
- **跃迁模式**（`warpParticles.js` 迁移）：3D 透视投影 `sx = cx + (p.x / p.z) * focal`；速度随距离衰减；方向随机扰动；warp 配置常量（particleCount=320, zMax=200 等）保留为脚本内 `【可改】` 常量
- **模式状态机**：`mode = 'network' | 'warp'`，通过 `.hero.is-warp` 类切换两 canvas opacity（0.8s 过渡）；network 模式下 Three.js 始终运行，warp 模式下 Canvas 2D 运行
- **IntersectionObserver**：离开 `.hero` 视口时暂停两套 raf
- **MutationObserver**：监听 `document.documentElement` 的 `data-theme` 属性，切换粒子/连线颜色（网络）与重读 `--fg`（跃迁）
- **localStorage**：`rs-warp` 键持久化 mode，默认 `network`，兼容旧值 `on`
- **无障碍**：`prefers-reduced-motion: reduce` 时不启动跃迁模式，隐藏切换按钮

**放置位置**：在 `index.astro` 的 `<section class="hero">` 内部第一个子元素位置插入 `<HeroParticles />`。

---

### 阶段 6：布局（3 个文件）

#### 6.1 `src/layouts/BaseLayout.astro`

**职责**：全站 HTML 外壳，所有页面的根布局。

**Props**：
```ts
interface Props {
  title: string;          // <title> 内容
  description?: string;   // meta description
  activeNav?: string;     // 预留（Navbar 已用 pathname 判断）
}
```

**`<head>` 内容**：
- `<meta charset>` / `<viewport>`
- **主题防闪烁内联脚本**（必须在 CSS 之前）：`document.documentElement.dataset.theme = localStorage.getItem('rs-theme') || 'dark'`
- `<link rel="icon" href="/favicon.svg">`
- `<title>{title}</title>` + `<meta name="description">`
- Google Fonts `<link>`（Fraunces + IBM Plex Sans + JetBrains Mono）
- **KaTeX CSS CDN**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">`
- **样式导入**（顺序）：theme.css → typography.css → global.css → components.css → pages.css → markdown.css → warpParticles.css

**`<body>` 结构**：
```
<Navbar />
<main><slot /></main>
<Footer />
<SearchBox />
```

#### 6.2 `src/layouts/PostLayout.astro`（笔记详情）

**职责**：包裹 `BaseLayout`，提供笔记详情页的 `<article class="note-detail">` 外壳。

**Props**：
```ts
interface Props {
  title: string;
  date: string;
  readingTime: number;
  wordCount: number;
  views: number;         // 初始 0，客户端 recordView 后更新
  slug: string;          // 用于 recordView
}
```

**结构**：
```
<BaseLayout title={`${title} · RS NOTES`}>
  <article class="note-detail">
    <a class="note-back" href="/notes">← Back to Notes</a>
    <div class="note-detail__header">
      <span class="eyebrow">{date}</span>
      <h1 class="note-detail__title">{title}</h1>
      <div class="note-detail__meta">
        <span>{date}</span>
        <span class="note-views" data-id={slug}>{views} views</span>
        <span>约 {readingTime} 分钟阅读</span>
        <span>{wordCount} 字</span>
      </div>
    </div>
    <div class="note-detail__body">
      <slot />
    </div>
  </article>
</BaseLayout>
```

**客户端脚本**：调用 `readingStats.recordView(slug)` 递增并更新 `[data-id]` 显示。

#### 6.3 `src/layouts/ResearchLayout.astro`（科研详情）

**职责**：包裹 `BaseLayout`，提供科研详情页的 `<article class="project">` 外壳。

**Props**：
```ts
interface Props {
  title: string;
  status: string;
  date: string;
  tags: string[];
  description: string;
  cover: string;
  slug: string;
}
```

**结构**：渲染 project-hero（back link + eyebrow + h1 + description + cover + project-meta + tags），`<slot />` 接收 markdown 渲染内容。

---

### 阶段 7：页面（6 个文件）

#### 7.1 `src/pages/index.astro`（首页）

**数据**：`getCollection('research')`/`'notes'`/`'share'`，按 date 降序取前 2 条作为第二屏预览。

**结构**：
- `<section class="hero">`：`<HeroParticles />` + `.hero__bg-img`（条件渲染 `home.background.image`）+ `.hero__bg-overlay`（条件渲染 `home.background.overlay`）+ `.hero__inner`（avatar + eyebrow + title + tagline + cta）+ `.hero__scroll`
- `<section class="sections" id="sections">`：waves SVG + 三入口卡片（Research/Notes/Share），每个入口内含服务端渲染的预览行

**`<script>` 逻辑**（迁移 `home.js`）：
- `import gsap from 'gsap'`
- `heroIntro()`：GSAP timeline 入场动画（avatar → eyebrow → title → tagline → cta → scroll），`prefers-reduced-motion` 时降级为直接显示
- `bindHeroScrollSnap()`：wheel/touch/键盘 三方式 Hero↔sections 平滑切换，900ms 防抖锁，搜索打开时不接管
- 预览阅读量补全：遍历 `[data-note-views]` 用 `readingStats.getViewCount` 填充
- `observeReveals`：已在 Navbar.astro 处理，此处无需重复（Navbar 的 IO 会捕获页面所有 `.reveal`）

#### 7.2 `src/pages/research/index.astro`（科研列表）

**数据**：`getCollection('research')`，按 date 降序。

**结构**：
- `.page-head`（eyebrow + h1 + p）
- `.research__filters`：全部/进行中/已完成/规划中 四个按钮
- `.grid.grid-3`：遍历渲染 `<ProjectCard project={entry} />`，每个卡片加 `data-status={entry.data.status}`

**`<script>`**：筛选按钮点击 → 切换 `is-active` → 遍历 `[data-status]` 卡片切换 `display`。

#### 7.3 `src/pages/research/[slug].astro`（科研详情）

**数据**：`getStaticPaths()` 从 research collection 生成路径；`entry.render()` 获取 `<Content />` 组件。

**结构**：用 `ResearchLayout` 包裹，`<entry.Content />` 放入 `<slot />`（实际是作为 children 传入）。markdown 由 Astro 构建时渲染（Shiki 高亮 + KaTeX）。

#### 7.4 `src/pages/notes/index.astro`（笔记列表）

**数据**：`getCollection('notes')`，按 date 降序。构建时计算 tag → count 映射。

**结构**：
- `.page-head`
- `.notes-layout`：左侧 `.notes-sidebar`（搜索 input + tag cloud，每个 tag 按钮带 count）+ 右侧 `.notes-list`（遍历 `<NoteCard note={entry} />`，每个加 `data-tags={tags.join(',')}`）

**`<script>`**：
- tag cloud 点击 → 切换 `is-active` → 按 `data-tags` 筛选 `.note-item`
- 搜索 input → debounce 150ms → 按 title/summary/tags 筛选
- 遍历 `.note-views[data-id]` 用 `readingStats.getViewCount` 填充

#### 7.5 `src/pages/notes/[slug].astro`（笔记详情）

**数据**：`getStaticPaths()`；`entry.body`（原始 markdown 文本，用于字数统计）；`entry.render()`；`entry.getHeadings()`（构建 TOC）。

**逻辑**：
- 字数/阅读时长：`readingStats.countWords(entry.body)` + `readingStats.estimateReadingTime(entry.body)`
- 初始 views = 0，客户端 `recordView` 后更新

**结构**：用 `PostLayout` 包裹。在 `<slot />` 位置插入：
- `<entry.Content />`（markdown 正文，包在 `<div class="markdown">` 内）
- `<aside class="note-toc">`：从 `getHeadings()` 服务端渲染，每个链接 `data-toc={slug}`

**`<script>`**：
- `readingStats.recordView(slug)` → 更新 `.note-views` 显示
- `bindScrollSpy()`：IntersectionObserver 滚动高亮 TOC
- 平滑锚点：`a[href^="#"]` 点击 `scrollIntoView`

#### 7.6 `src/pages/share/index.astro`（分享页）

**数据**：`getCollection('share')`，按 date 降序。

**结构**：
- `.page-head`
- `.share-layout`：搜索 input + `.timeline`（遍历 `<ShareCard item={entry} />`，每个加 `data-title`/`data-text` 用于搜索）
- 灯箱 DOM：`.lightbox` + `.lightbox__close` + `#lightboxImg` + `.lightbox__caption`

**`<script>`**：
- 搜索 input → debounce 150ms → 按 `data-title`/`data-text` 筛选 `.tl-item`
- 灯箱：点击 `[data-lightbox]` → 打开；close 按钮 / 背景点击 / Esc → 关闭
- 锚点跳转：`location.hash` → `scrollIntoView`

---

### 阶段 8：脚本与端点（2 个文件）

#### 8.1 `src/scripts/readingStats.ts`

**导出**：
```ts
export function countWords(text: string): number;        // 中文 + 英文单词
export function estimateReadingTime(text: string): number; // 字数/200，向上取整，最小 1
export function recordView(id: string): number;           // localStorage 递增，返回新值
export function getViewCount(id: string): number;         // 只读
```

**键名**：`article_views_${id}`（保持与原项目一致）。

#### 8.2 `src/pages/search-index.json.ts`

**类型**：Astro 端点（`GET`）。

**逻辑**：构建时从三个 collection 读取，输出 JSON：
```ts
export async function GET() {
  const [research, notes, share] = await Promise.all([
    getCollection('research'),
    getCollection('notes'),
    getCollection('share')
  ]);
  return new Response(JSON.stringify({
    research: research.map(r => ({ type: 'research', title: r.data.title, snippet: r.data.description, tags: r.data.tags, url: `/research/${r.slug}` })),
    notes: notes.map(n => ({ type: 'notes', title: n.data.title, snippet: n.data.summary, tags: n.data.tags, url: `/notes/${n.slug}` })),
    share: share.map(s => ({ type: 'share', title: s.data.title, snippet: s.body.slice(0,120), tags: [], url: `/share#${s.slug}` }))
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

**注意**：`SearchBox.astro` 的 `filter()` 中 `item.tags.join(' ')` 假设 tags 是数组，与此端点输出一致。

---

### 阶段 9：构建验证与清理

#### 9.1 补充 GSAP 依赖
- `package.json` 添加 `"gsap": "^3.12.5"` 到 dependencies
- 运行 `npm install`

#### 9.2 构建验证
- 运行 `npm run build`
- 修复所有编译错误（重点关注：Astro 组件 props 类型、Content Collections 查询、`entry.render()`/`entry.getHeadings()` 用法）
- 运行 `npm run preview` 抽查首页/列表页/详情页/搜索

#### 9.3 旧文件清理
构建通过后删除：
- 根目录 HTML：`index.html`、`research.html`、`notes.html`、`share.html`
- 目录：`research/`、`notes/`、`css/`、`js/`、`effects/`、`styles/`、`data/`、`config/`、`assets/`、`scripts/`

**保留**：`package.json`、`astro.config.mjs`、`tsconfig.json`、`src/`、`public/`、`node_modules/`、`.trae/`、`.gitignore`（如有）

---

## 验证步骤

1. **构建成功**：`npm run build` 无错误，`dist/` 生成所有页面
2. **页面可达**：`/`、`/research`、`/research/{slug}`、`/notes`、`/notes/{slug}`、`/share`、`/search-index.json` 均 200
3. **功能验证**（preview 模式）：
   - 首页粒子网络显示，切换按钮可切到跃迁模式，刷新后状态保持
   - 首页向下滑动平滑过渡到第二屏，向上回第一屏
   - 主题切换（太阳/月亮按钮）粒子颜色跟随变化
   - 科研列表状态筛选正常
   - 科研详情 markdown 渲染（含代码高亮、公式）
   - 笔记列表标签筛选 + 搜索筛选
   - 笔记详情 TOC 滚动高亮 + 阅读量递增
   - 分享页图片灯箱 + 搜索
   - 全局搜索（`/` 或 `Cmd+K`）实时筛选，点击跳转
4. **旧文件已删除**：根目录无 `.html`，`css/`/`js/`/`data/` 等目录已移除

---

## 执行顺序

1. 阶段 8.1：`readingStats.ts`（无依赖，被多处引用）
2. 阶段 5：`HeroParticles.astro`
3. 阶段 6.1：`BaseLayout.astro`
4. 阶段 6.2 / 6.3：`PostLayout.astro` / `ResearchLayout.astro`
5. 阶段 8.2：`search-index.json.ts`
6. 阶段 7.1：`index.astro`
7. 阶段 7.2 / 7.3：research 页面
8. 阶段 7.4 / 7.5：notes 页面
9. 阶段 7.6：share 页面
10. 阶段 9.1：补 GSAP 依赖
11. 阶段 9.2：构建验证
12. 阶段 9.3：旧文件清理
