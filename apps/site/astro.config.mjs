import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://SITE_DOMAIN',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
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
        baseUrl: 'https://github.com/PLACEHOLDER_ORG/AIgov/edit/main/apps/site/',
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
        { label: 'About',       link: '/about/' },
        { label: "What's new",  link: '/whats-new/', badge: { text: 'Phase 3', variant: 'note' } },
        { label: 'Wizard',      link: '/wizard/',    badge: { text: 'Phase 4', variant: 'note' } },
      ],
    }),
    mdx(),
  ],
});
