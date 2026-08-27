import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/blog/api";
import { assertAdminApi } from "@/lib/blog/auth";
import { createSiteHub, listSiteHubs } from "@/lib/site-cms/repository";

function activityTimestamp(item: { updatedAt?: string | null; createdAt?: string | null; publishedAt?: string | null }) {
  const value = item.updatedAt || item.createdAt || item.publishedAt || "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export async function GET() {
  try {
    await assertAdminApi();
    const hubs = await listSiteHubs();
    return NextResponse.json([...hubs].sort((a, b) => activityTimestamp(b) - activityTimestamp(a)));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const hub = await createSiteHub(await request.json());
    revalidatePath(hub.path);
    revalidatePath("/ferramentas");
    revalidatePath("/sitemap.xml");
    return NextResponse.json(hub, { status: 201 });
  } catch (error) { return apiError(error); }
}
