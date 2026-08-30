import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/blog/supabase";
import { publishDueScheduledPosts } from "@/lib/blog/repository";
import { deliverPendingBlogPostEmails } from "@/lib/marketing/blog-post-campaign";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const publishedScheduledPosts = await publishDueScheduledPosts();
    const blogPostEmails = await deliverPendingBlogPostEmails(250);
    const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseRest(`customer_communications?created_at=lt.${encodeURIComponent(cutoff)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true, cutoff, publishedScheduledPosts, blogPostEmails });
  } catch (error) {
    console.error("communication_retention_failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Communication retention cleanup failed" }, { status: 500 });
  }
}
