import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'one-more-highlight',
  tagline: 'Multi-state substring highlighting for React.',
  favicon: 'img/favicon-omh-32.png',
  headTags: [
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', href: '/img/favicon-omh-180.png' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' } },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
      },
    },
  ],
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
        {
          href: 'https://github.com/RonenMars/one-more-highlight/blob/main/CHANGELOG.md',
          label: 'Changelog',
          position: 'left',
        },
        {
          href: 'https://stackblitz.com/github/RonenMars/one-more-highlight/tree/main/examples/playground',
          label: 'Playground',
          position: 'left',
        },
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
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
