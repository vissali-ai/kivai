import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { getInstagramAnalyzerConfig, saveInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";

export async function GET() {
  try {
    await assertAdminApi();
    return Response.json(await getInstagramAnalyzerConfig());
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertAdminApi();
    return Response.json(await saveInstagramAnalyzerConfig(await request.json()));
  } catch (error) {
    return apiError(error);
  }
}
