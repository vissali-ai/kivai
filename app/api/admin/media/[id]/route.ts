import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { deleteMediaRecord, listMedia, mediaUsageCount, updateMedia } from "@/lib/blog/repository";
import { blogConfig } from "@/lib/blog/config";
import { supabaseStorage } from "@/lib/blog/supabase";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try { await assertAdminApi(); return NextResponse.json(await updateMedia((await params).id, await request.json())); }
  catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const id = (await params).id;
    if (await mediaUsageCount(id)) throw new Error("Esta mídia é capa de uma matéria e não pode ser excluída.");
    const media = (await listMedia()).find((item) => item.id === id);
    if (!media) return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 });
    await supabaseStorage(`object/${blogConfig.storageBucket}/${media.storagePath}`, { method: "DELETE" });
    await deleteMediaRecord(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
