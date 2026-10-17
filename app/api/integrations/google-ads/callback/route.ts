import { finishGoogleAdsConsent, googleAdsOAuthReturnPage } from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function finish(status: "connected" | "denied" | "failed") {
  const url = new URL(googleAdsOAuthReturnPage());
  url.searchParams.set("google_ads_connection", status);
  // Response.redirect() devolve headers imutáveis no runtime Vercel/Next.js.
  // Definir todos os headers na construção impede o TypeError: immutable.
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return finish("denied");
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  if (!state || !code) return finish("failed");
  try {
    await finishGoogleAdsConsent(state, code);
    return finish("connected");
  } catch {
    // Não registrar tokens, code, state ou dados da conta em logs.
    return finish("failed");
  }
}
