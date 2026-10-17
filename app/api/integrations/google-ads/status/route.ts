import { googleAdsConnectionReadiness } from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = googleAdsConnectionReadiness();
  return Response.json({
    available: configured.ready,
    missingConfiguration: !configured.oauth ? "oauth" :
      !configured.encryption ? "encryption" : null,
    // Não retornar Client ID, Client Secret nem outros segredos.
  }, { headers: { "Cache-Control": "no-store" } });
}
