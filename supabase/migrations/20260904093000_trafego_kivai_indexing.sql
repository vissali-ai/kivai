update public.site_services
set indexable = true,
    include_in_sitemap = false,
    status = 'published',
    show_in_services_index = false
where slug = 'trafego-kivai';
