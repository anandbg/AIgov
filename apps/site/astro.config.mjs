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
        // NOTE: PersonaSwitch is NOT wired as Starlight's Header override here
        // because overriding Header replaces the whole site nav (loses search +
        // theme toggle). Phase 2 (CNT-02) will introduce a `<HeaderActions>` slot
        // or render PersonaSwitch via a tiny Starlight `SiteTitle` companion.
        // Phase 1 surfaces PersonaSwitch on the fixture page only.
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
            { label: '1. AI Policy',              link: '/stages/ai-policy/',          badge: { text: 'Phase 2', variant: 'note' } },
            { label: '2. Risk Tiering',           link: '/stages/risk-tiering/',       badge: { text: 'Phase 2', variant: 'note' } },
            { label: '3. Risk Check',             link: '/stages/risk-check/',         badge: { text: 'Phase 2', variant: 'note' } },
            { label: '4. Compliance',             link: '/stages/compliance/',         badge: { text: 'Phase 2', variant: 'note' } },
            { label: '5. Third-party AI Risk',    link: '/stages/third-party-risk/',   badge: { text: 'Phase 2', variant: 'note' } },
            { label: '6. Data Controls',          link: '/stages/data-controls/',      badge: { text: 'Phase 2', variant: 'note' } },
            { label: '7. Continuous Red-teaming', link: '/stages/red-teaming/',        badge: { text: 'Phase 2', variant: 'note' } },
            { label: '8. Documentation',          link: '/stages/documentation/',      badge: { text: 'Phase 2', variant: 'note' } },
            { label: '9. Accountability',         link: '/stages/accountability/',     badge: { text: 'Phase 2', variant: 'note' } },
            { label: '10. Agentic AI Oversight',  link: '/stages/agentic-oversight/',  badge: { text: 'Phase 2', variant: 'note' } },
            { label: '11. Incident Response',     link: '/stages/incident-response/',  badge: { text: 'Phase 2', variant: 'note' } },
            { label: '12. Monitoring',            link: '/stages/monitoring/',         badge: { text: 'Phase 2', variant: 'note' } },
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
