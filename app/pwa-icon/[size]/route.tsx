import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Usa o logo já existente no projeto; não cria um símbolo de marca paralelo.
export async function GET(request: NextRequest, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (size !== "192" && size !== "512") {
    return new Response("Ícone não encontrado.", { status: 404 });
  }

  const dimension = Number(size);
  const logoUrl = new URL("/logo.png", request.url);
  const logoResponse = await fetch(logoUrl, { cache: "force-cache" });
  if (!logoResponse.ok || !(logoResponse.headers.get("content-type") ?? "").startsWith("image/")) {
    return new Response("Logo indisponível.", { status: 503 });
  }

  const logoBase64 = Buffer.from(await logoResponse.arrayBuffer()).toString("base64");
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#17151f" }}>
      <img
        src={`data:image/png;base64,${logoBase64}`}
        width={Math.round(dimension * 0.72)}
        height={Math.round(dimension * 0.72)}
        alt=""
      />
    </div>,
    {
      width: dimension,
      height: dimension,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
