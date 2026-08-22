This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Painel administrativo do blog

1. Crie um projeto no Supabase e execute `supabase/migrations/001_blog_cms.sql` no SQL Editor.
2. Copie `.env.example` para `.env.local` e preencha as credenciais. A service role nunca deve usar o prefixo `NEXT_PUBLIC_`.
3. Execute `npm run dev`, abra `/login` e use `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
4. Cadastre categorias e imagens, depois crie a primeira matéria em `/admin/blog/nova`.

O painel salva novos conteúdos como rascunho, protege também as APIs no servidor, sanitiza o HTML editorial e publica somente após uma ação explícita. O storage é o bucket `blog-media`; uploads são validados e deduplicados por SHA-256.

### Agente editorial de notícias

1. Execute `supabase/migrations/002_blog_featured_and_categories.sql` e `supabase/migrations/003_news_agent.sql` no SQL Editor.
2. Configure `NEWS_AGENT_CRON_SECRET`. O agente funciona somente como radar: coleta e classifica pautas, sem escrever ou publicar matérias.
3. Abra `/admin/blog/agente` para testar uma coleta manual e consultar o histórico.
4. No Supabase Cron, crie uma chamada HTTP `POST` para `https://www.kivai.com.br/api/cron/news-agent` com a expressão `0 */4 * * *` e o header `Authorization: Bearer SEU_NEWS_AGENT_CRON_SECRET`.
5. Para adicionar as fontes brasileiras padrão, aplique também `supabase/migrations/004_brazilian_rss_sources.sql`.
6. Cada execução coleta até 12 pautas relevantes. A publicação exige fonte primária, pesquisa, contribuição original, vínculo com ferramentas do Kivai e aprovação humana registrada no editor.
7. As fontes especializadas internacionais de IA, marketing e e-commerce estão em `supabase/migrations/005_specialized_rss_sources.sql`.
8. As fontes brasileiras especializadas de IA, marketing e e-commerce estão em `supabase/migrations/006_brazilian_specialized_rss_sources.sql`.
9. Para manter apenas fontes em português e criar a categoria Guia de Ferramentas, aplique `supabase/migrations/007_portuguese_sources_and_tools_guide.sql`.

Cada execução consulta apenas feeds permitidos, elimina URLs e pautas repetidas, respeita o limite configurado de rascunhos e nunca publica. Rascunhos automáticos exigem revisão humana e imagem de capa antes da publicação.

### Radar de notícias e tendências

1. Depois das migrações do agente editorial, aplique `supabase/migrations/011_news_radar_pilot.sql`.
2. O piloto público fica em `/ferramentas/radar-de-tendencias` e usa somente Marketing, Inteligência Artificial e E-commerce.
3. Configure `NEWS_RADAR_ENABLED`, `NEWS_RADAR_CACHE_SECONDS` e `NEWS_RADAR_REQUEST_LIMIT` conforme `.env.example`.
4. Cache, trava de concorrência, rate limit e métricas agregadas ficam no Supabase. Nenhum endereço IP é persistido nas métricas.
5. Os indicadores dos últimos 30 dias aparecem em `/admin/blog/agente`.
