delete from public.blog_rss_sources
where feed_url in (
  'https://feeds.arstechnica.com/arstechnica/index',
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://blog.google/rss/',
  'https://openai.com/news/rss.xml',
  'https://news.mit.edu/rss/topic/artificial-intelligence2',
  'https://huggingface.co/blog/feed.xml',
  'https://deepmind.google/blog/rss.xml',
  'https://blog.hubspot.com/marketing/rss.xml',
  'https://www.searchenginejournal.com/feed/',
  'https://www.socialmediaexaminer.com/feed/',
  'https://www.practicalecommerce.com/feed',
  'https://www.digitalcommerce360.com/feed/'
);

insert into public.blog_categories (name, slug, description)
values (
  'Guia de Ferramentas',
  'guia-de-ferramentas',
  'Guias didáticos que explicam o funcionamento e o uso das ferramentas do Kivai.'
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;
