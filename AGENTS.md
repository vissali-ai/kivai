<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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


# Kivai change safety and code hygiene rules

These rules apply to every change made by Codex, ChatGPT, or any other coding agent, including retention/onboarding/PWA work. Preservation of working functionality is mandatory.

1. **Read before writing.** First inspect the latest `main` HEAD, the current version of every affected file, nearby components, imports, routes, styles, tests, and relevant database structures. Do not assume that previous chat excerpts or older checkout copies are current.
2. **Reuse before creating.** Search for an existing implementation of the feature before adding components, hooks, API routes, styles, dependencies, tables, or migrations. Extend or refactor the canonical implementation instead of stacking a duplicate alongside it.
3. **Replace obsolete logic cleanly.** When a newer implementation supersedes an older one, integrate the change into the correct location and remove the old implementation only after checking all references, usage paths, and compatibility. Never leave dead code, duplicate UI, unused imports, redundant dependencies, or inactive parallel systems behind.
4. **Never overwrite newer work with stale code.** Re-fetch the latest file content immediately before editing, use narrowly scoped changes, verify the expected file SHA or branch HEAD, and stop on conflicts. Do not force-push or replace whole files with older snapshots. Reconcile concurrent updates first.
5. **Protect unrelated working behavior.** Do not modify or delete any unrelated working feature, paid/free plan rule, authentication flow, tool processor, SEO/content behavior, layout, analytics, settings, or existing data. Favor small, backwards-compatible changes. Do not perform broad rewrites without explicit authorization.
6. **Check all affected surfaces.** Validate the flow in public pages and Admin when applicable, mobile and desktop layouts, logged-in and logged-out experiences, and any existing integrations. Add or update focused tests when feasible. Inspect the actual diff for accidental changes and regressions.
7. **Avoid database and deployment surprises.** Verify existing schemas and migrations before introducing new ones. Use safe additive migrations if needed, preserve records and permissions, and never remove old data or structures without explicit approval. Before publishing, check the exact branch, commit, test/build results, and deployment target.
8. **Report what was verified.** Describe precisely what changed, what was reused or replaced, which tests passed, what could not be verified, and whether production deployment actually completed. Never claim mobile visual checks or end-to-end success unless performed.
9. **Stop instead of guessing.** If code has changed unexpectedly, a replacement is ambiguous, or modifying a feature risks breaking something currently working, pause and request clarification rather than forcing an overwrite.
