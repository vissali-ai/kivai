import { INSTAGRAM_TUTORIAL_SPRITE_FIXED } from "@/lib/instagram-tutorial-sprite-fixed";

export const runtime = "nodejs";

export async function GET() {
  try {
    const image = Buffer.from(INSTAGRAM_TUTORIAL_SPRITE_FIXED, "base64");

    if (!image.length) {
      return new Response("Imagem indisponível.", { status: 404 });
    }

    return new Response(image, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(image.length),
      },
    });
  } catch {
    return new Response("Não foi possível carregar o tutorial.", { status: 500 });
  }
}
