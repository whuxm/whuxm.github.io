/**
 * RS NOTES 站点配置
 * 全站通过 window.SITE_CONFIG 读取配置
 *
 * 标注【可改】的字段都可自行调整，无需改动 JS/CSS。
 */
window.SITE_CONFIG = {
  title: 'RS NOTES',                  // 【可改】站点标题（显示在导航栏与页脚）
  subtitle: 'Research · Notes · Share',// 【可改】站点副标题（页脚元信息）
  description: '科研工作者的个人知识管理系统',
  logo: 'assets/favicon.svg',            // 【可改】Logo 图片地址（导航栏 + 页脚）
  avatar: 'assets/avatar.svg',        // 【可改】首页头像图片地址
  author: {
    name: 'RS',
    bio: 'Researcher & Developer · 聚焦科研可视化与知识沉淀',
    location: 'Earth'
  },
  social: [                           // 【可改】页脚社交链接；icon 可选 github/mail/rss
    { name: 'GitHub', url: 'https://github.com/whuxm', icon: 'github' },
    { name: 'Email', url: '3165684725@qq.com', icon: 'mail' },
    { name: 'RSS', url: '#', icon: 'rss' }
  ],
  nav: [                              // 【可改】导航菜单项；url 为根目录下的相对路径
    { name: 'Home', url: 'index.html' },
    { name: 'Research', url: 'research.html' },
    { name: 'Notes', url: 'notes.html' },
    { name: 'Share', url: 'share.html' }
  ],
  hero: {
    greeting: 'Hello, I’m',
    name: 'RS',
    tagline: '在黑白之间，沉淀科研与代码的痕迹。',
    cta: { label: '进入第二屏', href: '#sections' },

    /* ===== 首屏背景图配置 =====
       可替换为任意图片 URL；留空 '' 则使用纯渐变背景。
       透明度/模糊/遮罩用于保证 hero 文字始终可读。 */
    background: {
      image: 'assets/background1.png',  // 【可改】背景图 URL，如 'https://example.com/bg.jpg'；留空用渐变
      opacity: 0.35,       // 【可改】背景图透明度 0~1（越小越淡，建议 0.2~0.5）
      blur: 0,             // 【可改】背景图模糊半径 px（0=清晰，4=轻微模糊）
      overlay: true        // 【可改】是否叠加暗色遮罩（true 时浅色图也能保证文字可读）
    },

    /* ===== 粒子网络配置 =====
       数值越小越疏散，连线距离越大连线越密集。 */
    particles: {
      count: 40,           // 【可改】桌面端粒子数量（越小越疏散，建议 40~120）
      countMobile: 26,     // 【可改】移动端粒子数量
      linkDistance: 0.10,  // 【可改】连线归一化距离 0~1（0=无连线，越大连线越密）
      size: 2.4,           // 【可改】粒子点大小
      opacity: 0.85,       // 【可改】粒子透明度 0~1
      color: '#ffffff',    // 【可改】深色主题粒子颜色（十六进制）
      colorLight: '#111111' // 【可改】浅色主题粒子颜色（十六进制）
    }
  }
};
