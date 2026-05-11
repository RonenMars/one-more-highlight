import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/intro',
        'getting-started/installation',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/basic-highlighting',
        'guides/multi-state-styling',
        'guides/headless-hook',
        'guides/render-prop',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/highlight-props',
        'api/use-highlight',
        'api/match-builders',
        'api/types',
      ],
    },
    {
      type: 'category',
      label: 'Recipes',
      items: [
        'recipes/browser-support',
        'recipes/diacritic-insensitive',
        'recipes/overlap-strategies',
      ],
    },
  ],
};

export default sidebars;
