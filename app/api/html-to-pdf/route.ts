const MAX_BODY_BYTES = 5_500_000;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ detail: "Conteúdo muito grande." }, { status: 413 });
  }

  const body = await request.text();
  if (!body || new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return Response.json({ detail: "Conteúdo inválido ou muito grande." }, { status: 413 });
  }

  const backendUrl = (process.env.KIVAI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  try {
    const response = await fetch(`${backendUrl}/html-to-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      const detail = await response.text();
      return new Response(detail, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") || "application/json" } });
    }
    return new Response(await response.arrayBuffer(), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="documento.pdf"', "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ detail: "O serviço de conversão está temporariamente indisponível." }, { status: 503 });
  }
}
