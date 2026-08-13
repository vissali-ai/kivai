import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { listPosts, savePost } from "@/lib/blog/repository";
import type { PostInput, PostStatus } from "@/lib/blog/types";

export async function GET(request: NextRequest) {
  try {
    await assertAdminApi();
    const params = request.nextUrl.searchParams;
    const posts = await listPosts({
      query: params.get("q") ?? "",
      status: (params.get("status") as PostStatus | "all") ?? "all",
      categoryId: params.get("category") ?? "",
      page: Number(params.get("page") || 1),
    });
    return NextResponse.json(posts);
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const post = await savePost(await request.json() as PostInput);
    return NextResponse.json(post, { status: 201 });
  } catch (error) { return apiError(error); }
}
