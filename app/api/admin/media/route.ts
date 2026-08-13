import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { createMedia, findMediaByHash, listMedia } from "@/lib/blog/repository";
import { blogConfig } from "@/lib/blog/config";
import { publicStorageUrl, supabaseStorage } from "@/lib/blog/supabase";
import type { MediaSource } from "@/lib/blog/types";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try { await assertAdminApi(); return NextResponse.json(await listMedia(request.nextUrl.searchParams.get("q") ?? "")); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Selecione uma imagem.");
    if (!allowedTypes.has(file.type)) throw new Error("Formato inválido. Use JPG, PNG ou WebP.");
    if (file.size > maxSize) throw new Error("A imagem deve ter no máximo 8 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    const duplicate = await findMediaByHash(contentHash);
    if (duplicate) return NextResponse.json({ ...duplicate, duplicate: true });
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const storagePath = `${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
    await supabaseStorage(`object/${blogConfig.storageBucket}/${storagePath}`, {
      method: "POST", body: bytes, headers: { "Content-Type": file.type, "x-upsert": "false" },
    });
    const media = await createMedia({
      url: publicStorageUrl(storagePath), storagePath, filename: file.name, mimeType: file.type,
      width: Math.max(1, Number(form.get("width")) || 1), height: Math.max(1, Number(form.get("height")) || 1),
      size: file.size, alt: String(form.get("alt") ?? ""), caption: String(form.get("caption") ?? ""),
      credit: String(form.get("credit") ?? ""), source: String(form.get("source") || "other") as MediaSource,
      sourceUrl: String(form.get("sourceUrl") ?? ""), contentHash,
    });
    return NextResponse.json(media, { status: 201 });
  } catch (error) { return apiError(error); }
}
