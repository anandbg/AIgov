import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';
import icon from 'astro-icon';
import { visit } from 'unist-util-visit';

const BASE_PATH = '/AIgov';

// Rewrite absolute internal links (e.g. /stages/01-ai-policy/) inside Markdown/MDX
// content so the deployed project page (anandbg.github.io/AIgov/...) resolves them
// correctly. Astro does NOT auto-prefix base into Markdown link nodes, only its own
// chrome — this plugin closes that gap.
function remarkBasePrefix() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      if (typeof node.url !== 'string') return;
      if (!node.url.startsWith('/')) return;
      if (node.url.startsWith('//')) return;
      if (node.url.startsWith(`${BASE_PATH}/`) || node.url === BASE_PATH) return;
      node.url = `${BASE_PATH}${node.url}`;
    });
  };
}

export default defineConfig({
  // Project-page deploy: lives at https://anandbg.github.io/AIgov/
  site: 'https://anandbg.github.io',
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: { remarkPlugins: [remarkBasePrefix] },
  vite: { plugins: [tailwindcss()] },
  integrations: [
    mermaid({ theme: 'neutral', autoTheme: true }),
    icon({ include: { lucide: ['*'] } }),
    starlight({
      title: 'AI Governance',
      description: 'Plain-language AI governance, current to this week.',
      customCss: ['./src/styles/global.css'],
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/SiteFooter.astro',
        Banner: './src/components/SustainabilityNotice.astro',
        // CNT-02: PersonaSwitch lives in Starlight's SocialIcons slot (top-right of
        // nav, beside theme toggle + search) so it persists site-wide without
        // overriding the whole Header.
        SocialIcons: './src/components/HeaderActions.astro',
      },
      social: [],
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      lastUpdated: false,
      editLink: {
        baseUrl: 'https://github.com/anandbg/AIgov/edit/main/apps/site/',
      },
      favicon: '/favicon.svg',
      sidebar: [
        {
          label: 'AI Governance Journey',
          items: [
            { label: '1. AI Policy',              link: '/stages/01-ai-policy/',          },
            { label: '2. Risk Tiering',           link: '/stages/02-risk-tiering/',       },
            { label: '3. Risk Check',             link: '/stages/03-risk-check/',         },
            { label: '4. Compliance',             link: '/stages/04-compliance/',         },
            { label: '5. Third-party AI Risk',    link: '/stages/05-third-party-risk/',   },
            { label: '6. Data Controls',          link: '/stages/06-data-controls/',      },
            { label: '7. Continuous Red-teaming', link: '/stages/07-red-teaming/',        },
            { label: '8. Documentation',          link: '/stages/08-documentation/',      },
            { label: '9. Accountability',         link: '/stages/09-accountability/',     },
            { label: '10. Agentic AI Oversight',  link: '/stages/10-agentic-oversight/',  },
            { label: '11. Incident Response',     link: '/stages/11-incident-response/',  },
            { label: '12. Monitoring',            link: '/stages/12-monitoring/',         },
          ],
        },
        {
          label: 'Agent Academy — Foundry',
          collapsed: true,
          items: [
            { label: 'Overview',                       link: '/foundry/overview/',                },
            { label: '1. Get a subscription',          link: '/foundry/01-subscription/',         },
            { label: '2. Create the Foundry resource', link: '/foundry/02-foundry-resource/',     },
            { label: '3. New Foundry experience',      link: '/foundry/03-new-experience/',       },
            { label: '4. The quota wall',              link: '/foundry/04-quota-wall/',           },
            { label: '5. Serverless model',            link: '/foundry/05-serverless-model/',     },
            { label: '6. Create agent + remove Bing',  link: '/foundry/06-create-agent/',         },
            { label: '7. Allow-listed tool',           link: '/foundry/07-allowlisted-tool/',     },
            { label: '8. Instructions & run',          link: '/foundry/08-instructions-and-run/', },
          ],
        },
        { label: 'About',       link: '/about/' },
        { label: "What's new",  link: '/whats-new/' },
        { label: 'Wizard',      link: '/wizard/' },
      ],
    }),
    mdx(),
  ],
});
