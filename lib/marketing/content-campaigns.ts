import "server-only";

import { listMarketingAudienceUsers, matchesMarketingAudience, type MarketingAudience } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { getCustomerMarketingTemplate } from "@/lib/marketing/templates";
import { tools } from "@/lib/tools";

const SITE_URL = "https://www.kivai.com.br";

type DispatchRow = {
  source_type: "blog" | "tool";
  source_id: string;
};

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
};

type CmsToolRow = {
  slug: string;
  title: string;
  short_description: string;
  path: string;
  published_at: string | null;
};

function render(value: string, replacements: Record<string, string>) {
  let next = value;
  for (const [key, replacement] of Object.entries(replacements)) {
    next = next.replaceAll(`{{${key}}}`, replacement);
  }
  return next;
}

async function queueEmail(input: {
  userId: string;
  eventKey: string;
  subject: string;
  message: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  flowKey: "new_post" | "blog_digest" | "new_tool";
  recipientEmail: string;
  metadata?: Record<string, unknown>;
}) {
  const rows = await supabaseRest<Array<{ id: string }>>("customer_communications?on_conflict=event_key,channel", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      user_id: input.userId,
      event_key: input.eventKey,
      channel: "email",
      status: "ready",
      subject: input.subject,
      message: input.message,
      cta_label: input.ctaLabel ?? null,
      cta_url: input.ctaUrl ?? null,
      scheduled_for: new Date().toISOString(),
      metadata: {
        source: "automatic_content_campaign",
        flow_key: input.flowKey,
        kind: input.flowKey,
        layout: "kivai_campaign",
        recipient_email: input.recipientEmail,
        ...(input.metadata ?? {}),
      },
    }),
  });
  if (!rows[0]) return "duplicate" as const;
  const result = await deliverCustomerEmail(rows[0].id);
  return result.status;
}

async function markDispatched(sourceType: "blog" | "tool", sourceId: string, publishedAt: string | null, kind: string) {
  await supabaseRest("content_campaign_dispatches?on_conflict=source_type,source_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      source_type: sourceType,
      source_id: sourceId,
      published_at: publishedAt,
      dispatch_kind: kind,
    }),
  });
}

export async function processContentCampaigns() {
  const [eligibleUsers, settings, dispatches, newPostTemplate, digestTemplate, newToolTemplate, blogPosts, cmsTools] = await Promise.all([
    listMarketingAudienceUsers(),
    supabaseRest<Array<{ automatic_audience: MarketingAudience }>>("admin_marketing_reminders?select=automatic_audience&id=eq.1&limit=1"),
    supabaseRest<DispatchRow[]>("content_campaign_dispatches?select=source_type,source_id"),
    getCustomerMarketingTemplate("new_post"),
    getCustomerMarketingTemplate("blog_digest"),
    getCustomerMarketingTemplate("new_tool"),
    supabaseRest<BlogPostRow[]>("blog_posts?select=id,title,slug,excerpt,published_at&status=eq.published&order=published_at.desc.nullslast,created_at.desc&limit=100"),
    supabaseRest<CmsToolRow[]>("site_contents?select=slug,title,short_description,path,published_at&content_type=eq.tool&status=eq.published"),
  ]);

  const selectedAudience = settings[0]?.automatic_audience ?? "all";
  const users = eligibleUsers.filter((user) => matchesMarketingAudience(user, selectedAudience));

  const dispatchedBlogs = new Set(dispatches.filter((row) => row.source_type === "blog").map((row) => row.source_id));
  const dispatchedTools = new Set(dispatches.filter((row) => row.source_type === "tool").map((row) => row.source_id));
  const pendingBlogs = blogPosts.filter((post) => !dispatchedBlogs.has(post.id));

  const results = {
    blogPosts: pendingBlogs.length,
    blogEmailsQueued: 0,
    blogDigest: false,
    tools: 0,
    toolEmailsQueued: 0,
  };

  if (pendingBlogs.length > 3 && digestTemplate?.enabled) {
    const featured = pendingBlogs.slice(0, 3);
    const links = `<ul>${featured.map((post) => `<li><a href="${SITE_URL}/blog/${post.slug}">${post.title}</a></li>`).join("")}</ul>`;
    const batchId = featured.map((post) => post.id.slice(0, 8)).join("-");
    for (const user of users) {
      const status = await queueEmail({
        userId: user.id,
        eventKey: `blog_digest_${batchId}_${user.id}`,
        subject: digestTemplate.subject,
        message: render(digestTemplate.message, { links }),
        ctaLabel: digestTemplate.cta_label,
        ctaUrl: digestTemplate.cta_url,
        flowKey: "blog_digest",
        recipientEmail: user.email,
        metadata: {
          post_ids: pendingBlogs.map((post) => post.id),
          featured_post_ids: featured.map((post) => post.id),
          template_version: digestTemplate.updated_at,
        },
      });
      if (status !== "duplicate") results.blogEmailsQueued += 1;
    }
    for (const post of pendingBlogs) {
      await markDispatched("blog", post.id, post.published_at, "blog_digest");
    }
    results.blogDigest = true;
  } else if (pendingBlogs.length && newPostTemplate?.enabled) {
    for (const post of pendingBlogs) {
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      for (const user of users) {
        const status = await queueEmail({
          userId: user.id,
          eventKey: `new_post_${post.id}_${user.id}`,
          subject: render(newPostTemplate.subject, { titulo: post.title, resumo: post.excerpt, slug: post.slug, link: postUrl }),
          message: render(newPostTemplate.message, { titulo: post.title, resumo: post.excerpt, slug: post.slug, link: postUrl }),
          ctaLabel: newPostTemplate.cta_label,
          ctaUrl: newPostTemplate.cta_url ? render(newPostTemplate.cta_url, { titulo: post.title, resumo: post.excerpt, slug: post.slug, link: postUrl }) : postUrl,
          flowKey: "new_post",
          recipientEmail: user.email,
          metadata: { post_id: post.id, post_slug: post.slug, template_version: newPostTemplate.updated_at },
        });
        if (status !== "duplicate") results.blogEmailsQueued += 1;
      }
      await markDispatched("blog", post.id, post.published_at, "new_post");
    }
  }

  const cmsToolMap = new Map(cmsTools.map((item) => [item.slug, item]));
  const toolItems = tools.map((tool) => {
    const cms = cmsToolMap.get(tool.slug);
    return {
      slug: tool.slug,
      title: cms?.title || tool.name,
      description: cms?.short_description || tool.description,
      path: cms?.path || `/ferramentas/${tool.slug}`,
      publishedAt: cms?.published_at ?? null,
    };
  });
  const pendingTools = toolItems.filter((tool) => !dispatchedTools.has(tool.slug));
  results.tools = pendingTools.length;

  if (newToolTemplate?.enabled) {
    for (const tool of pendingTools) {
      const toolUrl = `${SITE_URL}${tool.path}`;
      for (const user of users) {
        const status = await queueEmail({
          userId: user.id,
          eventKey: `new_tool_${tool.slug}_${user.id}`,
          subject: render(newToolTemplate.subject, { titulo: tool.title, resumo: tool.description, slug: tool.slug, link: toolUrl }),
          message: render(newToolTemplate.message, { titulo: tool.title, resumo: tool.description, slug: tool.slug, link: toolUrl }),
          ctaLabel: newToolTemplate.cta_label,
          ctaUrl: newToolTemplate.cta_url ? render(newToolTemplate.cta_url, { titulo: tool.title, resumo: tool.description, slug: tool.slug, link: toolUrl }) : toolUrl,
          flowKey: "new_tool",
          recipientEmail: user.email,
          metadata: { tool_slug: tool.slug, template_version: newToolTemplate.updated_at },
        });
        if (status !== "duplicate") results.toolEmailsQueued += 1;
      }
      await markDispatched("tool", tool.slug, tool.publishedAt, "new_tool");
    }
  }

  return results;
}
