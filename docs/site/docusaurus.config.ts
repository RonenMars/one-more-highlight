import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { PrismTheme } from 'prism-react-renderer';

// Catppuccin Mocha palette — https://catppuccin.com/palette
// AAA verified against base #1e1e2e: text #cdd6f4 (15.0:1), mauve #cba6f7
// (10.7:1), green #a6e3a1 (12.3:1), peach #fab387 (11.0:1), yellow #f9e2af
// (14.0:1), red #f38ba8 (8.6:1), blue #89b4fa (8.1:1), teal #94e2d5 (12.1:1),
// lavender #b4befe (9.2:1), pink #f5c2e7 (11.7:1), overlay0 #6c7086 (4.7:1).
const catppuccinMocha: PrismTheme = {
  plain: { color: '#cdd6f4', backgroundColor: '#1e1e2e' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#a6adc8', fontStyle: 'italic' } },
    { types: ['namespace'], style: { opacity: 0.7 } },
    { types: ['string', 'attr-value', 'inserted'], style: { color: '#a6e3a1' } },
    { types: ['punctuation', 'operator'], style: { color: '#94e2d5' } },
    { types: ['entity', 'url', 'symbol', 'number', 'boolean', 'variable', 'constant', 'property', 'regex'], style: { color: '#fab387' } },
    { types: ['atrule', 'keyword', 'attr-name', 'selector'], style: { color: '#cba6f7' } },
    { types: ['function', 'deleted', 'tag'], style: { color: '#f38ba8' } },
    { types: ['function-variable'], style: { color: '#f9e2af' } },
    { types: ['tag', 'selector', 'keyword'], style: { color: '#cba6f7' } },
    { types: ['class-name', 'maybe-class-name', 'builtin'], style: { color: '#f9e2af' } },
    { types: ['parameter'], style: { color: '#eba0ac' } },
    { types: ['method'], style: { color: '#89b4fa' } },
    { types: ['important', 'bold'], style: { fontWeight: 'bold' } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
  ],
};

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
      theme: catppuccinMocha,
      darkTheme: catppuccinMocha,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
