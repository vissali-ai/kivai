import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

export type BlogPublicationControls = {
  indexable: boolean;
  includeInSitemap: boolean;
  blockVisibility: Record<string, boolean>;
};

type ControlsRow = {
  indexable: boolean | null;
  include_in_sitemap: boolean | null;
  block_visibility: Record<string, boolean> | null;
};

type SitemapControlsRow = ControlsRow & { slug: string };

const DEFAULT_BLOCK_VISIBILITY = {
  header: true,
  subtitle: true,
  cover: true,
  content: true,
  source: true,
  tags: true,
  relatedTools: true,
  share: true,
};

function normalizeBlockVisibility(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.keys(DEFAULT_BLOCK_VISIBILITY).map((key) => [key, source[key] !== false]));
}

export async function getBlogPublicationControlsById(id: string): Promise<BlogPublicationControls> {
  try {
    const rows = await supabaseRest<ControlsRow[]>(
      `blog_posts?select=indexable,include_in_sitemap,block_visibility&id=eq.${encodeURIComponent(id)}&limit=1`,
      { allowMissingConfig: true },
    );
    return {
      indexable: rows[0]?.indexable !== false,
      includeInSitemap: rows[0]?.include_in_sitemap !== false,
      blockVisibility: normalizeBlockVisibility(rows[0]?.block_visibility),
    };
  } catch {
    return { indexable: true, includeInSitemap: true, blockVisibility: { ...DEFAULT_BLOCK_VISIBILITY } };
  }
}

export async function getBlogPublicationControlsBySlug(slug: string): Promise<BlogPublicationControls> {
  try {
    const rows = await supabaseRest<ControlsRow[]>(
      `blog_posts?select=indexable,include_in_sitemap,block_visibility&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { allowMissingConfig: true },
    );
    return {
      indexable: rows[0]?.indexable !== false,
      includeInSitemap: rows[0]?.include_in_sitemap !== false,
      blockVisibility: normalizeBlockVisibility(rows[0]?.block_visibility),
    };
  } catch {
    return { indexable: true, includeInSitemap: true, blockVisibility: { ...DEFAULT_BLOCK_VISIBILITY } };
  }
}

export async function listBlogSitemapSlugs() {
  try {
    const rows = await supabaseRest<SitemapControlsRow[]>(
      "blog_posts?select=slug,indexable,include_in_sitemap,block_visibility&indexable=eq.true&include_in_sitemap=eq.true",
      { allowMissingConfig: true },
    );
    return new Set(rows.map((row) => row.slug));
  } catch {
    return new Set<string>();
  }
}

export async function updateBlogPublicationControls(id: string, controls: BlogPublicationControls) {
  const indexable = Boolean(controls.indexable);
  const includeInSitemap = indexable && Boolean(controls.includeInSitemap);
  const blockVisibility = normalizeBlockVisibility(controls.blockVisibility);
  await supabaseRest(
    `blog_posts?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ indexable, include_in_sitemap: includeInSitemap, block_visibility: blockVisibility }),
    },
  );
  return { indexable, includeInSitemap, blockVisibility };
}
