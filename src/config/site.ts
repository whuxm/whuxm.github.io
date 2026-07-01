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
  logo: '/favicon.svg',
  avatar: '/avatar.svg',
  author: {
    name: 'RS',
    bio: 'Researcher & Developer · 聚焦科研可视化与知识沉淀',
    location: 'Earth'
  },
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
