import { authenticateBillingUser } from "@/lib/billing/sumup";
import { getAccountAccess } from "@/lib/billing/access";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { blogConfig } from "@/lib/blog/config";
import { FAVICON_BUCKET, hostingLimit } from "@/lib/favicon/hosting";

export const runtime = "nodejs";
type HostedRow = { id: string; public_url: string; byte_size: number; created_at: string; storage_path: string };
const noStore = { "Cache-Control": "private, no-store" };
function bad(message: string, status: number) { return Response.json({ error: message }, { status, headers: noStore }); }
export async function GET(req: Request) {
  try {
    const user = await authenticateBillingUser(req);
    const { plan } = await getAccountAccess(user.id);
    const rows = await supabaseRest<HostedRow[]>(`hosted_favicons?select=id,public_url,byte_size,created_at,storage_path&user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc&limit=500`);
    return Response.json({ files: rows.map(({storage_path: _path, ...rest}) => rest), plan, limit: hostingLimit(plan).count }, { headers: noStore });
  } catch { return bad("Não foi possível consultar seus favicons. Verifique sua sessão.", 503); }
}
export async function POST(req: Request) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(req); } catch { return bad("Entre na sua conta para hospedar o favicon.", 401); }
  try {
    const { plan } = await getAccountAccess(user.id);
    const limit = hostingLimit(plan);
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > limit.maxBytes + 4096) return bad("Arquivo acima do limite do seu plano.", 413);
    const form = await req.formData();
    const file = form.get("favicon");
    if (!(file instanceof File)) return bad("Selecione um favicon ICO.", 400);
    if (file.size < 1 || file.size > limit.maxBytes) return bad("Arquivo acima do limite do seu plano.", 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length < 22 || bytes[0] !== 0 || bytes[1] !== 0 || bytes[2] !== 1 || bytes[3] !== 0 || bytes[4] === 0 || bytes[5] !== 0) return bad("O arquivo não é um ICO válido.", 400);
    const path = `${user.id}/${crypto.randomUUID()}.ico`;
    const baseUrl = blogConfig.supabaseUrl;
    if (!baseUrl) return bad("Hospedagem indisponível.", 503);
    const publicUrl = `${baseUrl}/storage/v1/object/public/${FAVICON_BUCKET}/${path}`;
    const reservedId = await supabaseRest<string>("rpc/kivai_reserve_favicon", {method:"POST",body:JSON.stringify({p_user_id:user.id,p_path:path,p_url:publicUrl,p_bytes:file.size})});
    try {
      await supabaseStorage(`object/${FAVICON_BUCKET}/${path}`, {method:"POST",headers:{"Content-Type":"image/x-icon","Cache-Control":"public, max-age=31536000, immutable", "x-upsert":"false"},body:bytes});
    } catch {
      await supabaseRest(`hosted_favicons?id=eq.${encodeURIComponent(reservedId)}&user_id=eq.${encodeURIComponent(user.id)}`,{method:"DELETE"}).catch(()=>{});
      return bad("Não foi possível hospedar o arquivo. Tente novamente.",503);
    }
    return Response.json({id:reservedId,url:publicUrl,size:file.size}, {status:201,headers:noStore});
  } catch(e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("FAVICON_QUOTA")) return bad("Você atingiu o limite de hospedagens do seu plano.",409);
    if (message.includes("FAVICON_TOO_LARGE")) return bad("Arquivo acima do limite do seu plano.",413);
    return bad("Hospedagem ainda não configurada ou indisponível.",503);
  }
}
