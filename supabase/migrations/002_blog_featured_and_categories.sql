alter table public.blog_posts
  add column if not exists featured boolean not null default false,
  add column if not exists featured_order smallint;

alter table public.blog_posts
  drop constraint if exists blog_posts_featured_order_check;

alter table public.blog_posts
  add constraint blog_posts_featured_order_check
  check (
    (featured = false and featured_order is null)
    or (featured = true and featured_order between 1 and 12)
  );

create index if not exists blog_posts_featured_idx
  on public.blog_posts(featured, featured_order)
  where featured = true;

insert into public.blog_categories (name, slug, description)
values
  ('Notícias', 'noticias', 'Notícias e novidades selecionadas pela equipe Kivai.'),
  ('Inteligência Artificial', 'inteligencia-artificial', 'Conteúdos sobre inteligência artificial e suas aplicações.'),
  ('Tecnologia', 'tecnologia', 'Notícias, análises e tendências de tecnologia.'),
  ('Marketing', 'marketing', 'Estratégias, ferramentas e novidades de marketing.'),
  ('E-commerce', 'e-commerce', 'Conteúdos para comércio eletrônico e negócios digitais.')
on conflict (slug) do nothing;
