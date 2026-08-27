import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

export type BlogPublicationControls = {
  indexable: boolean;
  includeInSitemap: boolean;
};

type ControlsRow = {
  indexable: boolean | null;
  include_in_sitemap: boolean | null;
};

export async function getBlogPublicationControlsById(id: string): Promise<BlogPublicationControls> {
  try {
    const rows = await supabaseRest<ControlsRow[]>(
      `blog_posts?select=indexable,include_in_sitemap&id=eq.${encodeURIComponent(id)}&limit=1`,
      { allowMissingConfig: true },
    );
    return {
      indexable: rows[0]?.indexable !== false,
      includeInSitemap: rows[0]?.include_in_sitemap !== false,
    };
  } catch {
    return { indexable: true, includeInSitemap: true };
  }
}

export async function getBlogPublicationControlsBySlug(slug: string): Promise<BlogPublicationControls> {
  try {
    const rows = await supabaseRest<ControlsRow[]>(
      `blog_posts?select=indexable,include_in_sitemap&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { allowMissingConfig: true },
    );
    return {
      indexable: rows[0]?.indexable !== false,
      includeInSitemap: rows[0]?.include_in_sitemap !== false,
    };
  } catch {
    return { indexable: true, includeInSitemap: true };
  }
}

export async function updateBlogPublicationControls(id: string, controls: BlogPublicationControls) {
  const indexable = Boolean(controls.indexable);
  const includeInSitemap = indexable && Boolean(controls.includeInSitemap);
  await supabaseRest(
    `blog_posts?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ indexable, include_in_sitemap: includeInSitemap }),
    },
  );
  return { indexable, includeInSitemap };
}
