export interface HomeConfig {
  greeting: string;
  name: string;
  tagline: string;
  cta: { label: string; href: string };
  background: {
    image: string;
    opacity: number;
    blur: number;
    overlay: boolean;
  };
  particles: {
    count: number;
    countMobile: number;
    linkDistance: number;
    size: number;
    opacity: number;
    color: string;
    colorLight: string;
  };
}

export const home: HomeConfig = {
  greeting: 'Hello, I’m',
  name: 'RS',
  tagline: '在黑白之间，沉淀科研与代码的痕迹。',
  cta: { label: '进入第二屏', href: '#sections' },

  background: {
    image: '/background.png',  // 【可改】背景图路径，留空 '' 用纯渐变
    opacity: 0.35,       // 【可改】背景图透明度 0~1
    blur: 0,             // 【可改】背景图模糊半径 px
    overlay: true        // 【可改】是否叠加暗色遮罩
  },

  particles: {
    count: 40,           // 【可改】桌面端粒子数量
    countMobile: 26,     // 【可改】移动端粒子数量
    linkDistance: 0.10,  // 【可改】连线归一化距离 0~1
    size: 2.4,           // 【可改】粒子点大小
    opacity: 0.85,       // 【可改】粒子透明度 0~1
    color: '#ffffff',    // 【可改】深色主题粒子颜色
    colorLight: '#111111' // 【可改】浅色主题粒子颜色
  }
};
