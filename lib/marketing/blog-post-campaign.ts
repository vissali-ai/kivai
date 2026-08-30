import "server-only";

import { listRegisteredEmailUsers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { getCustomerMarketingTemplate } from "@/lib/marketing/templates";

const SITE_URL = "https://www.kivai.com.br";

type PublishedPostCampaign = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
};

function render(value: string, post: PublishedPostCampaign) {
  return value
    .replaceAll("{{titulo}}", post.title)
    .replaceAll("{{resumo}}", post.excerpt)
    .replaceAll("{{slug}}", post.slug)
    .replaceAll("{{link}}", `${SITE_URL}/blog/${post.slug}`);
}

export async function deliverPendingBlogPostEmails(limit = 50) {
  const rows = await supabaseRest<Array<{ id: string; status: string; metadata: Record<string, unknown> | null }>>(
    `customer_communications?select=id,status,metadata&channel=eq.email&status=in.(ready,failed)&metadata->>flow_key=eq.new_post&scheduled_for=lte.${encodeURIComponent(new Date().toISOString())}&order=created_at.asc&limit=${limit}`,
  );
  const results = { checked: rows.length, sent: 0, canceled: 0, failed: 0, skipped: 0 };
  for (const row of rows) {
    if (row.status === "failed") {
      const retries = typeof row.metadata?.blog_retry_count === "number" ? row.metadata.blog_retry_count : 0;
      if (retries >= 3) {
        results.skipped += 1;
        continue;
      }
      await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(row.id)}&status=eq.failed`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ready", error: null, metadata: { ...(row.metadata ?? {}), blog_retry_count: retries + 1 }, updated_at: new Date().toISOString() }),
      });
    }
    const result = await deliverCustomerEmail(row.id);
    if (result.status === "sent") results.sent += 1;
    else if (result.status === "canceled") results.canceled += 1;
    else if (result.status === "failed") results.failed += 1;
    else results.skipped += 1;
  }
  return results;
}

export async function queueNewPostCampaign(post: PublishedPostCampaign) {
  const template = await getCustomerMarketingTemplate("new_post");
  if (!template?.enabled) return { queued: 0, delivery: null, disabled: true };

  const users = await listRegisteredEmailUsers();
  if (!users.length) return { queued: 0, delivery: null, disabled: false };

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const rows = await supabaseRest<Array<{ id: string }>>("customer_communications?on_conflict=event_key,channel", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(users.map((user) => ({
      user_id: user.id,
      event_key: `new_post_${post.id}_${user.id}`,
      channel: "email",
      status: "ready",
      subject: render(template.subject, post),
      message: render(template.message, post),
      cta_label: template.cta_label || "Ler publicação completa",
      cta_url: postUrl,
      scheduled_for: new Date().toISOString(),
      metadata: {
        source: "automatic_blog_post",
        flow_key: "new_post",
        kind: "new_blog_post",
        post_id: post.id,
        post_slug: post.slug,
        post_published_at: post.publishedAt,
        recipient_email: user.email,
        template_version: template.updated_at,
      },
    }))),
  });

  const delivery = await deliverPendingBlogPostEmails(50);
  return { queued: rows.length, delivery, disabled: false };
}
