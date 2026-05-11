import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'one-more-highlight',
  tagline: 'Multi-state substring highlighting for React.',
  favicon: 'img/favicon.ico',
  url: 'https://one-more-highlight.vercel.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/RonenMars/one-more-highlight/edit/main/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'one-more-highlight',
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { to: '/docs/playground', label: 'Playground', position: 'left' },
        {
          href: 'https://github.com/RonenMars/one-more-highlight',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/one-more-highlight',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `MIT © ${new Date().getFullYear()} Ronen Mars`,
    },
    prism: { theme: require('prism-react-renderer').themes.github },
  } satisfies Preset.ThemeConfig,
};

export default config;
