<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kivai CMS rule

Every new piece of public content added to Kivai must also be manageable from the Admin panel in the same delivery.

This rule applies to tools, hubs, services, pages, resources, guides and other public content.

- Existing and new tools must be registered in the central tool catalog used by the Admin. Never hardcode a tool only inside a hub page.
- New non-tool public content must be created through, or registered with, the site CMS so it appears in Admin immediately.
- The Admin must allow editing of all safe content fields: title, summary, editorial copy, SEO, hub/category placement, publication status, indexability, sitemap inclusion and media/tutorial content when applicable.
- Executable application logic must remain in code and must not be editable as arbitrary JavaScript from Admin.
- A public feature is not considered complete if it is visible on the site but absent from Admin.
- Before finishing any new public content implementation, verify both the public route and its corresponding Admin entry.
