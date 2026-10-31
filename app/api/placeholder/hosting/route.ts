import { authenticateBillingUser } from "@/lib/billing/sumup";
import { getAccountAccess } from "@/lib/billing/access";
import { supabaseRest, supabaseStorage } from "@/lib/blog/supabase";
import { blogConfig } from "@/lib/blog/config";
import { FAVICON_HOSTING_LIMITS } from "@/lib/favicon/hosting";

export const runtime = "nodejs";
const BUCKET = "hosted-placeholders";
const noStore = { "Cache-Control": "private, no-store" };
type Row = { id: string; public_url: string; byte_size: number; created_at: string; storage_path: string };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers: noStore });

export async function GET(req: Request) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(req); } catch { return fail("Entre na sua conta.", 401); }
  try {
    const { plan } = await getAccountAccess(user.id);
    const rows = await supabaseRest<Row[]>(`hosted_placeholders?select=id,public_url,byte_size,created_at,storage_path&user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc&limit=500`);
    return Response.json({files:rows.map(({storage_path: _path, ...rest})=>rest),plan,limit:FAVICON_HOSTING_LIMITS[plan].count},{headers:noStore});
  } catch { return fail("Não foi possível consultar seus placeholders.",503); }
}

export async function POST(req: Request) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(req); } catch { return fail("Entre na sua conta para hospedar o placeholder.", 401); }
  try {
    const { plan } = await getAccountAccess(user.id);
    const limit = FAVICON_HOSTING_LIMITS[plan];
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > limit.maxBytes+4096) return fail("Arquivo acima do limite do seu plano.",413);
    const form = await req.formData();
    const file = form.get("placeholder");
    if (!(file instanceof File)) return fail("Selecione um placeholder JPEG.",400);
    if (file.size < 1 || file.size > limit.maxBytes) return fail("Arquivo acima do limite do seu plano.",413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length-2] !== 0xff || bytes[bytes.length-1] !== 0xd9) return fail("O arquivo não é um JPEG válido.",400);
    const path = `${user.id}/${crypto.randomUUID()}.jpg`;
    const baseUrl = blogConfig.supabaseUrl;
    if (!baseUrl) return fail("Hospedagem indisponível.",503);
    const publicUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
    const id = await supabaseRest<string>("rpc/kivai_reserve_placeholder",{method:"POST",body:JSON.stringify({p_user_id:user.id,p_path:path,p_url:publicUrl,p_bytes:file.size})});
    try {
      await supabaseStorage(`object/${BUCKET}/${path}`,{method:"POST",headers:{"Content-Type":"image/jpeg","Cache-Control":"public, max-age=31536000, immutable","x-upsert":"false"},body:new Blob([bytes],{type:"image/jpeg"})});
    } catch {
      await supabaseRest(`hosted_placeholders?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,{method:"DELETE"}).catch(()=>{});
      return fail("Não foi possível hospedar o placeholder.",503);
    }
    return Response.json({id,url:publicUrl,size:file.size},{status:201,headers:noStore});
  } catch(e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("PLACEHOLDER_QUOTA")) return fail("Você atingiu o limite de hospedagens do seu plano.",409);
    if (message.includes("PLACEHOLDER_TOO_LARGE")) return fail("Arquivo acima do limite do seu plano.",413);
    return fail("Hospedagem indisponível no momento.",503);
  }
}

export async function DELETE(req: Request) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(req); } catch { return fail("Entre na sua conta.",401); }
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("Identificador inválido.",400);
  try {
    const rows = await supabaseRest<Row[]>(`hosted_placeholders?select=id,storage_path,public_url,byte_size,created_at&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    if (!rows[0]) return fail("Placeholder não encontrado.",404);
    await supabaseStorage(`object/${BUCKET}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({prefixes:[rows[0].storage_path]})});
    await supabaseRest(`hosted_placeholders?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user.id)}`,{method:"DELETE"});
    return Response.json({ok:true},{headers:noStore});
  } catch { return fail("Não foi possível excluir o placeholder.",503); }
}
