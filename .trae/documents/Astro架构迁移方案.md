# RS NOTES — Astro 架构迁移方案

## 摘要

将当前 vanilla HTML/CSS/JS 项目原地重构为 Astro 5 + TypeScript + Markdown/MDX 架构，实现内容与系统分离、低维护成本、AI 友好协作。保留全部 10 项核心交互特性（主题切换、跃迁粒子互切、阅读统计、搜索弹窗、Hero 滚动吸附、波浪动画、导航栏滚动动画、Markdown 渲染管线、入场动画、路径前缀机制）。

**用户决策**：
- 迁移策略：原地重构（在 `web_home/` 直接初始化 Astro）
- 图片处理：全部下载远程图片到 `public/`
- 旧文件：迁移验证通过后直接删除

---

## 当前状态分析

### 数据层（3 个 JSON + 4 个独立 .md）

| 文件 | schema | 正文 |
|------|--------|------|
| `data/research/index.json` | `id,title,cover(远程URL),tags[],status,date,intro,content(内联MD)` | 内联在 JSON |
| `notes/index.json` | `id,title,file,date,tags[],summary` | 分离到 `notes/*.md` |
| `data/share/index.json` | `id,date,title,text,images[](远程URL)` | text 字段 |

### 配置层
- `config/site.config.js` → `window.SITE_CONFIG`：title/subtitle/description/logo/avatar/author{name,bio,location}/social[]/nav[]/hero{greeting,name,tagline,cta,background{image,opacity,blur,overlay},particles{count,countMobile,linkDistance,size,opacity,color,colorLight}}

### JS 全局对象
- `window.RS`（utils.js）：fetchJSON/fetchText/countWords/estimateReadingTime/recordView(`article_views_${id}`)/getViewCount/getQuery/pathPrefix/url/extractSummary/escape/renderMarkdown/debounce/highlight/toast/observeReveals
- `window.RS_ICONS`（main.js）：内联 SVG 图标库
- `window.RS_SEARCH`（search.js）：毛玻璃搜索弹窗

### CSS 文件
`base.css`（变量+reset）/ `layout.css`（导航+栅格+页脚）/ `components.css`（按钮+卡片+搜索+时间轴+灯箱）/ `pages.css`（Hero+科研+笔记+分享）/ `markdown.css`（正文排版）/ `styles/warpParticles.css`

### CDN 依赖
Three.js 0.160.0 / GSAP 3.12.5 / Marked 11.1.1 / KaTeX 0.16.9 / Prism 1.29.0

### localStorage 键
`rs-theme`（主题）、`rs-warp`（粒子模式 `network`|`warp`，兼容旧 `on`）、`article_views_${id}`（阅读量）

---

## 提议变更

### 阶段 1：项目初始化

**目标**：在 `web_home/` 原地初始化 Astro 项目，旧文件暂留作参考。

#### 1.1 创建 `package.json`
```json
{
  "name": "rs-notes",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^3.0.0",
    "three": "^0.160.0",
    "gsap": "^3.12.5",
    "marked": "^11.1.1",
    "katex": "^0.16.9",
    "prismjs": "^1.29.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/three": "^0.160.0"
  }
}
```

#### 1.2 创建 `astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-dark' }  // 代码高亮（替代 Prism，Astro 内置）
  },
  vite: {
    optimizeDeps: { include: ['three', 'gsap'] }
  }
});
```

#### 1.3 创建 `tsconfig.json`
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@config/*": ["src/config/*"],
      "@styles/*": ["src/styles/*"]
    }
  }
}
```

#### 1.4 安装依赖
执行 `npm install`（用户环境 Node v24.18.0 + npm 11.16.0 已验证可用）。

---

### 阶段 2：内容迁移（Content Collections）

**目标**：将 JSON 数据转为带 frontmatter 的 Markdown，建立 Schema 校验。

#### 2.1 创建 `src/content/config.ts` — Schema 定义
```ts
import { defineCollection, z } from 'astro:content';

const research = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cover: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['ongoing', 'completed', 'planning']),
    date: z.string()
  })
});

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    date: z.string()
  })
});

const share = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    images: z.array(z.string())
  })
});

export const collections = { research, notes, share };
```

#### 2.2 迁移科研内容（4 篇）
对 `data/research/index.json` 中每个项目：
1. 创建 `src/content/research/{id}.md`
2. frontmatter：`title/description(=intro)/cover(本地化路径)/tags/status/date`
3. 正文：将 `content` 字段的内联 Markdown 提取为文件正文

示例 `src/content/research/neural-net-visualization.md`：
```md
---
title: 神经网络可视化引擎
description: 一个基于 WebGL 的交互式神经网络结构可视化引擎...
cover: /research/neural-net-visualization.jpg
tags: [deep-learning, visualization, webgl]
status: ongoing
date: 2026-06
---

## 研究背景

深度学习模型的可解释性长期是个难题...
```

#### 2.3 迁移笔记内容（4 篇）
将 `notes/*.md` 复制到 `src/content/notes/`，在文件头添加 frontmatter（从 `notes/index.json` 读取 title/tags/date/summary）。

示例 `src/content/notes/welcome-to-rs-notes.md`：
```md
---
title: 欢迎来到 RS NOTES
summary: RS NOTES 是一个面向科研与开发者的个人知识库...
tags: [about, guide]
date: 2026-06-28
---

（原 .md 正文保持不变）
```

#### 2.4 迁移分享内容（4 篇）
对 `data/share/index.json` 中每项：
1. 创建 `src/content/share/{id}.md`
2. frontmatter：`title/date/images[](本地化路径)`
3. 正文：`text` 字段内容

#### 2.5 下载远程图片到 `public/`
- 科研封面：4 张，下载到 `public/research/{id}.jpg`
- 分享图片：6 张，下载到 `public/share/{id}-{n}.jpg`
- 使用 Node 脚本批量下载（fetch + fs.writeFile）
- 更新各 .md frontmatter 中的路径为 `/research/xxx.jpg`、`/share/xxx.jpg`
- 现有 `assets/avatar.svg`、`assets/logo.svg`、`assets/favicon.svg`、`assets/background.png` 复制到 `public/`

---

### 阶段 3：配置系统

#### 3.1 创建 `src/config/site.ts`
```ts
export interface SiteConfig {
  siteTitle: string;
  subtitle: string;
  description: string;
  logo: string;
  avatar: string;
  author: { name: string; bio: string; location: string };
  social: { name: string; url: string; icon: string }[];
  navItems: { name: string; url: string }[];
}

export const site: SiteConfig = {
  siteTitle: 'RS NOTES',
  subtitle: 'Research · Notes · Share',
  description: '科研工作者的个人知识管理系统',
  logo: '/logo.svg',
  avatar: '/avatar.svg',
  author: { name: 'RS', bio: 'Researcher & Developer · 聚焦科研可视化与知识沉淀', location: 'Earth' },
  social: [
    { name: 'GitHub', url: 'https://github.com/whuxm', icon: 'github' },
    { name: 'Email', url: 'mailto:3165684725@qq.com', icon: 'mail' },
    { name: 'RSS', url: '#', icon: 'rss' }
  ],
  navItems: [
    { name: 'Home', url: '/' },
    { name: 'Research', url: '/research' },
    { name: 'Notes', url: '/notes' },
    { name: 'Share', url: '/share' }
  ]
};
```

#### 3.2 创建 `src/config/home.ts`
迁移 `hero` 配置块（greeting/name/tagline/cta/background/particles），保留 `【可改】` 注释。

---

### 阶段 4：样式系统

#### 4.1 创建 `src/styles/theme.css`
从 `base.css` 提取 `:root` 与 `[data-theme="light"]` 变量，统一命名为：
```css
:root {
  --bg: #0a0a0a;
  --text: #f5f5f5;
  --card: #141414;
  --border: #2a2a2a;
  --muted: #888;
  --accent: #fff;
  /* 保留现有 --bg-rgb / --bg-elev-rgb / --hero-from / --hero-to / --vignette / --nav-height / --dur / --ease */
}
[data-theme="light"] { /* 浅色覆盖 */ }
```

#### 4.2 创建 `src/styles/global.css`
合并 `base.css`（reset + 基础排版）+ `layout.css`（导航 + 栅格 + 页脚 + 容器）。

#### 4.3 创建 `src/styles/typography.css`
提取 `base.css` 中的 `--font-display / --font-body / --font-mono` 与 h1/h2/h3/body/code 字号规则。

#### 4.4 创建 `src/styles/components.css`
迁移现有 `components.css`（按钮/卡片/标签/搜索/时间轴/灯箱/笔记项/标签云/Toast）。

#### 4.5 创建 `src/styles/pages.css`
迁移现有 `pages.css`（Hero/科研/笔记/分享专属样式）。

#### 4.6 创建 `src/styles/markdown.css`
迁移现有 `markdown.css`（正文排版，适配 Astro 渲染的 `<Content />`）。

#### 4.7 保留 `src/styles/warpParticles.css`
迁移现有 `styles/warpParticles.css`。

---

### 阶段 5：组件迁移

#### 5.1 `src/components/Icon.astro`
内联 SVG 图标库，从 `main.js` 的 `ICONS` 对象迁移。
```astro
---
interface Props { name: string; }
const { name } = Astro.props;
const icons: Record<string, string> = { /* 迁移 ICONS */ };
---
<Fragment set:html={icons[name] || ''} />
```

#### 5.2 `src/components/Navbar.astro`
从 `main.js` renderNav/bindNav 迁移：
- 静态渲染导航结构（Astro 编译时生成 HTML）
- `<script>` 保留滚动状态切换、汉堡菜单、主题切换、搜索触发
- 主题切换逻辑：读写 `localStorage 'rs-theme'`，切换 `document.documentElement.dataset.theme`
- 搜索触发：`/` 与 `Cmd/Ctrl+K` 快捷键
- 导航高亮：基于 `Astro.url.pathname` 编译时判断

#### 5.3 `src/components/Footer.astro`
从 `main.js` renderFooter 迁移，静态渲染页脚结构。

#### 5.4 `src/components/SearchBox.astro`
从 `search.js` 迁移：
- Astro 组件渲染搜索框 DOM 骨架
- `<script>` 迁移 `RS_SEARCH` 对象逻辑
- 数据源改为运行时 fetch `/_content/research.json` 等 Astro Content Collections 端点，或构建时生成搜索索引 JSON 到 `public/search-index.json`
- 保留毛玻璃展开、实时筛选、Esc 关闭、延迟清空结果

#### 5.5 `src/components/HeroParticles.astro`
合并 `particles.js`（Three.js 粒子网络）+ `warpParticles.js`（Canvas 2D 跃迁星场）：
- 两个 canvas 元素（`#particles-canvas` 与 `.warp-canvas`）
- `<script>` 迁移两套粒子逻辑
- 模式状态机：`network` ↔ `warp`，通过 `.hero.is-warp` 类切换 opacity
- IntersectionObserver 离开首屏暂停
- MutationObserver 监听 `data-theme` 重读颜色变量
- localStorage `rs-warp` 持久化，默认 `network`
- 切换按钮挂载到 `.hero` 内

#### 5.6 `src/components/ProjectCard.astro`
```astro
---
interface Props { project: { slug: string; data: { title; description; cover; tags; status; date } } };
const { project } = Astro.props;
---
<a class="card" href={`/research/${project.slug}`}>
  <div class="card__cover"><img src={project.data.cover} alt={project.data.title} loading="lazy" /></div>
  <div class="card__body">...</div>
</a>
```

#### 5.7 `src/components/NoteCard.astro`
类似 ProjectCard，渲染笔记列表项（标题 + 摘要 + 标签 + 日期 + 阅读统计）。

#### 5.8 `src/components/ShareCard.astro`
渲染分享时间轴项（日期 + 标题 + 文本 + 图片瀑布流）。

---

### 阶段 6：布局

#### 6.1 `src/layouts/BaseLayout.astro`
```astro
---
import '../styles/global.css';
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';
import SearchBox from '../components/SearchBox.astro';
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script is:inline>
    document.documentElement.dataset.theme = localStorage.getItem('rs-theme') || 'dark';
  </script>
  <title>{title}</title>
  <!-- 字体、KaTeX、Prism CSS -->
</head>
<body>
  <Navbar />
  <main><slot /></main>
  <Footer />
  <SearchBox />
</body>
</html>
```

#### 6.2 `src/layouts/PostLayout.astro`（笔记详情）
- 渲染标题/元信息/阅读统计
- TOC 自动目录（从 Markdown headings 提取）
- `<slot />` 渲染正文
- `<script>` 迁移 `note-detail.js` 的 TOC 高亮逻辑

#### 6.3 `src/layouts/ResearchLayout.astro`（科研详情）
- 渲染封面/标题/元信息/状态
- `<slot />` 渲染正文
- 阅读统计

---

### 阶段 7：页面

#### 7.1 `src/pages/index.astro`（首页）
- 第一屏 Hero：标题/副标题/Avatar/Logo/CTA + HeroParticles 组件
- 第二屏：三模块引导（Research/Notes/Share 预览），从 Content Collections 读取最新 3 条
- `<script>` 迁移 `home.js` 的 `bindHeroScrollSnap()`（wheel/touch/keyboard 滚动吸附）+ `applyHeroBackground()` + 入场动画

#### 7.2 `src/pages/research/index.astro`
- 从 `getCollection('research')` 读取全部项目
- 标签筛选（`<script>` 迁移 `research.js` 筛选逻辑）
- ProjectCard 网格

#### 7.3 `src/pages/research/[slug].astro`
- `getStaticPaths()` 生成所有科研详情页
- 使用 ResearchLayout + `<Content />` 渲染 Markdown
- 阅读统计：调用 `recordView(slug)`

#### 7.4 `src/pages/notes/index.astro`
- 从 `getCollection('notes')` 读取全部笔记
- 侧边栏：搜索框 + 标签云
- NoteCard 列表
- `<script>` 迁移 `notes.js` 的搜索/筛选逻辑

#### 7.5 `src/pages/notes/[slug].astro`
- `getStaticPaths()` 生成所有笔记详情页
- 使用 PostLayout + `<Content />` 渲染 Markdown
- TOC 自动目录
- 阅读统计

#### 7.6 `src/pages/share/index.astro`
- 从 `getCollection('share')` 读取全部分享
- 时间轴 + 图片瀑布流 + 灯箱
- `<script>` 迁移 `share.js` 的灯箱/搜索逻辑

---

### 阶段 8：脚本迁移

#### 8.1 创建 `src/scripts/readingStats.ts`
```ts
const KEY_PREFIX = 'article_views_';

export function recordView(id: string): number {
  const key = `${KEY_PREFIX}${id}`;
  const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(count));
  return count;
}

export function getViewCount(id: string): number {
  return parseInt(localStorage.getItem(`${KEY_PREFIX}${id}`) || '0', 10);
}

export function estimateReadingTime(text: string): number {
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.ceil((chinese + english) / 200));
}
```
**注意**：键名保持 `article_views_${id}`，不改为用户文档中的 `view_{slug}`，以兼容已有数据。

#### 8.2 Markdown 渲染
Astro 内置 Markdown 渲染（含 Shiki 代码高亮），无需 Marked。但 KaTeX 数学公式需额外配置：
- 安装 `rehype-katex` + `remark-math`
- 在 `astro.config.mjs` 的 `markdown.syntaxHighlight` 配置
- 或保留客户端 KaTeX 渲染（在组件 `<script>` 中调用 `renderMathInElement`）

推荐：使用 `remark-math` + `rehype-katex`（构建时渲染，性能更好）。

#### 8.3 路径前缀
Astro 构建的页面使用根相对路径 `/research/xxx`，无需 `RS.pathPrefix()`。该机制可移除。但 `RS.url()` 的跳过绝对 URL 逻辑仍需保留（用于社交链接等）。

---

### 阶段 9：搜索索引生成

#### 9.1 创建 `src/scripts/generateSearchIndex.ts`
构建时生成 `public/search-index.json`：
```ts
import { getCollection } from 'astro:content';
export async function GET() {
  const [research, notes, share] = await Promise.all([
    getCollection('research'),
    getCollection('notes'),
    getCollection('share')
  ]);
  const index = {
    research: research.map(r => ({ id: r.slug, title: r.data.title, snippet: r.data.description, tags: r.data.tags, url: `/research/${r.slug}` })),
    notes: notes.map(n => ({ id: n.slug, title: n.data.title, snippet: n.data.summary, tags: n.data.tags, url: `/notes/${n.slug}` })),
    share: share.map(s => ({ id: s.slug, title: s.data.title, snippet: '', tags: [], url: `/share#${s.slug}` }))
  };
  return new Response(JSON.stringify(index));
}
```
放在 `src/pages/search-index.json.ts`，Astro 自动生成端点。

SearchBox.astro 的 `<script>` 改为 fetch `/search-index.json`。

---

### 阶段 10：清理

迁移验证通过后，删除以下旧文件/目录：
- `*.html`（index/research/notes/share/notes/article/research/project）
- `css/` 整个目录
- `js/` 整个目录
- `styles/` 整个目录（已迁移到 `src/styles/`）
- `effects/` 整个目录（已迁移到 HeroParticles.astro）
- `config/` 整个目录（已迁移到 `src/config/`）
- `data/` 整个目录（已迁移到 `src/content/`）
- `notes/` 整个目录（.md 已迁移到 `src/content/notes/`）
- `assets/` 整个目录（已复制到 `public/`）

---

## 假设与决策

1. **键名兼容**：阅读统计 localStorage 键保持 `article_views_${id}`（id = slug），不改为用户文档的 `view_{slug}`，以兼容已有浏览数据。
2. **粒子模式默认值**：首次访问默认 `network`（原 Three.js 粒子网络），与现有行为一致。
3. **路径前缀移除**：Astro 使用根相对路径，`RS.pathPrefix()` 机制移除，但 `RS.url()` 的绝对 URL 跳过逻辑保留用于社交链接。
4. **代码高亮**：从 Prism 迁移到 Astro 内置 Shiki（构建时渲染，无客户端 JS）。若需保留 Prism 客户端高亮（动态内容），可在 `astro.config.mjs` 中禁用 Shiki 并保留 Prism。
5. **数学公式**：推荐 `remark-math` + `rehype-katex`（构建时渲染）。若迁移成本高，可暂保留客户端 `RS.renderMarkdown` 方案。
6. **Three.js 集成**：通过 npm 安装 Three.js，在 HeroParticles.astro 的 `<script>` 中 `import * as THREE from 'three'`，Astro/Vite 自动打包。
7. **GSAP**：当前项目未深度使用 GSAP（入场动画用 IntersectionObserver 实现），可暂不引入，降低复杂度。
8. **MDX**：暂不启用 MDX（无 MDX 内容需求），仅用 Markdown。`@astrojs/mdx` 集成可保留供未来扩展。
9. **部署**：Vercel 自动识别 Astro 项目，无需额外配置。

---

## 验证步骤

### 构建验证
1. `npm run build` 成功，无 TypeScript 错误
2. `dist/` 目录生成所有静态页面
3. `public/search-index.json` 生成
4. 所有图片已下载到 `public/research/`、`public/share/`

### 运行时验证
5. `npm run dev` 启动，访问 `http://localhost:4321`
6. 首页：Hero 粒子网络显示，切换按钮可在 network↔warp 间切换，向下滑动自动过渡到第二屏
7. 主题切换按钮工作，刷新后主题保持
8. 导航栏滚动时增高 + 背景模糊
9. `/research`：4 个项目卡片显示，标签筛选工作，点击进入详情页
10. `/research/neural-net-visualization`：封面/标题/正文/公式/代码块正确渲染
11. `/notes`：4 个笔记列表显示，侧边栏搜索/标签筛选工作
12. `/notes/welcome-to-rs-notes`：正文/TOC/阅读统计显示，TOC 滚动高亮工作
13. `/share`：时间轴 + 瀑布流显示，图片点击打开灯箱
14. 搜索弹窗：`/` 或 `Cmd/Ctrl+K` 打开，实时筛选，Esc 关闭，过渡流畅
15. 阅读统计：访问笔记/科研详情页后，`localStorage` 中 `article_views_{slug}` 递增
16. 移动端：汉堡菜单工作，栅格响应式

### 旧文件清理验证
17. 确认 `dist/` 中无旧 HTML/CSS/JS 引用
18. 删除旧文件后 `npm run build` 仍成功
19. 浏览器无 404 错误

---

## 执行顺序

1. 阶段 1：项目初始化（创建配置文件 + npm install）
2. 阶段 2：内容迁移（JSON→Markdown + 下载图片）
3. 阶段 3：配置系统（site.ts + home.ts）
4. 阶段 4：样式系统（6 个 CSS 文件）
5. 阶段 5：组件迁移（8 个 .astro 组件）
6. 阶段 6：布局（3 个 Layout）
7. 阶段 7：页面（6 个页面）
8. 阶段 8：脚本迁移（readingStats.ts + 粒子 + 搜索 + 滚动吸附）
9. 阶段 9：搜索索引端点
10. 阶段 10：验证 + 清理旧文件

预计涉及新建文件约 30 个，删除旧文件约 25 个。
