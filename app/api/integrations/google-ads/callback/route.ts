import { finishGoogleAdsConsent } from "@/lib/google-ads/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://kivai.com.br/ferramentas/analisador-de-trafego-pago-google-ads";

function finish(status: "connected" | "denied" | "failed") {
  const url = new URL(BASE);
  url.searchParams.set("google_ads_connection", status);
  const response = Response.redirect(url.toString(), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
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
