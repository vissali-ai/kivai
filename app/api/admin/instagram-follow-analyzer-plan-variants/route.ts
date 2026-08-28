import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import {
  getInstagramAnalyzerPlanVariants,
  saveInstagramAnalyzerPlanVariant,
  type InstagramAnalyzerEditablePlan,
} from "@/lib/instagram-analyzer-plan-variants";

function validPlan(value: unknown): value is InstagramAnalyzerEditablePlan {
  return value === "free" || value === "pro" || value === "agency";
}

export async function GET() {
  try {
    await assertAdminApi();
    const base = await getInstagramAnalyzerConfig();
    return Response.json(await getInstagramAnalyzerPlanVariants(base));
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertAdminApi();
    const body = (await request.json()) as { plan?: unknown; config?: unknown };
    if (!validPlan(body.plan)) {
      return Response.json({ error: "Plano inválido." }, { status: 400 });
    }
    const base = await getInstagramAnalyzerConfig();
    return Response.json(await saveInstagramAnalyzerPlanVariant(body.plan, body.config, base));
  } catch (error) {
    return apiError(error);
  }
}
