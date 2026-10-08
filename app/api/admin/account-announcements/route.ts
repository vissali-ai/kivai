import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncements,
  updateAdminAnnouncement,
} from "@/lib/account/announcements";

const responseHeaders = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    await assertAdminApi();
    return Response.json(await listAdminAnnouncements(), { headers: responseHeaders });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const result = await createAdminAnnouncement(await request.json());
    return Response.json(result, { status: 201, headers: responseHeaders });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    await assertAdminApi();
    const input = await request.json() as Record<string, unknown>;
    if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.id)) {
      return Response.json({ error: "Aviso inválido." }, { status: 400 });
    }
    return Response.json(await updateAdminAnnouncement(input.id, input), { headers: responseHeaders });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    await assertAdminApi();
    const input = await request.json() as { id?: unknown };
    if (typeof input.id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.id)) {
      return Response.json({ error: "Aviso inválido." }, { status: 400 });
    }
    await deleteAdminAnnouncement(input.id);
    return Response.json({ ok: true }, { headers: responseHeaders });
  } catch (error) { return apiError(error); }
}
