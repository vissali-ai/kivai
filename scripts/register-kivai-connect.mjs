import nextEnv from "@next/env";
import fs from "node:fs";
import ts from "typescript";
nextEnv.loadEnvConfig(process.cwd());
const source = fs.readFileSync("lib/kivai-connect/content.ts", "utf8");
const compiled = { exports: {} };
new Function("exports", "module", ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(compiled.exports, compiled);
const { connectEditorial, hubEditorial } = compiled.exports;
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error("CMS credentials unavailable");
async function rest(path, method = "GET", body) {
  const response = await fetch(`${url}/rest/v1/${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw Error(`CMS ${response.status} for ${path.split("?")[0]}`);
  return response.json();
}
const slug = "kivai-connect";
let hubs = await rest("site_hubs?slug=eq.smart-tv-tv-box&select=*");
let contents = await rest(`site_contents?slug=eq.${slug}&select=*`);
if (process.argv.includes("--inspect")) {
  // Validate actual table fields without disclosing secrets or unrelated user data.
  const hubSample = await rest("site_hubs?select=*&limit=1");
  const contentSample = await rest("site_contents?select=*&limit=1");
  console.log(JSON.stringify({ hubFields: Object.keys(hubSample[0] ?? {}), contentFields: Object.keys(contentSample[0] ?? {}), existingHub: hubs.length, existingTool: contents.length }));
  process.exit(0);
}
if (!process.argv.includes("--publish") && !process.argv.includes("--draft")) throw Error("Use --inspect, --draft or --publish");
const status = process.argv.includes("--publish") ? "published" : "draft";
const publication = { status, indexable: status === "published", include_in_sitemap: status === "published", ...(status === "published" ? { published_at: new Date().toISOString() } : {}) };
if (!hubs.length) hubs = await rest("site_hubs", "POST", { slug: "smart-tv-tv-box", name: "Smart TV e TV Box", description: "Diagnóstico e orientação para Android TV e Google TV com conexão local autorizada. Comece pelo Kivai Connect para Windows.", path: "/ferramentas/smart-tv-tv-box", content_html: hubEditorial, seo_title: "Smart TV e TV Box: diagnóstico e orientação", seo_description: "Conheça as ferramentas Kivai para diagnosticar Android TV e Google TV. Conexão autorizada, diagnóstico local e orientações seguras.", ...publication });
else if (status === "published") hubs = await rest(`site_hubs?id=eq.${hubs[0].id}`, "PATCH", publication);
if (!contents.length) contents = await rest("site_contents", "POST", { content_type: "tool", slug, path: `/ferramentas/${slug}`, title: "Kivai Connect", short_description: "Conheça sua TV com diagnóstico local gratuito e orientações opcionais com IA. Requer auxiliar Windows e pareamento autorizado.", content_html: connectEditorial, seo_title: "Kivai Connect: diagnóstico de Android TV e Google TV", seo_description: "Consulte modelo, sistema, armazenamento e aplicativos da sua Android TV com o auxiliar Kivai Connect para Windows. Diagnóstico somente leitura.", canonical_url: "", hub_id: hubs[0].id, existing_tool_slug: slug, tool_mode: "auto", technical_status: "ready", display_location: "direct", show_in_most_used: false, display_order: 100, custom_data: { originalFields: [{ key: "tutorial-url", label: "URL do tutorial (HTTPS)", type: "url", value: "" }, { key: "badge", label: "Selo", type: "text", value: "Beta · Windows" }] }, ...publication });
else if (status === "published") contents = await rest(`site_contents?id=eq.${contents[0].id}`, "PATCH", publication);
console.log(JSON.stringify({ hub: { id: hubs[0].id, path: hubs[0].path, status: hubs[0].status }, tool: { id: contents[0].id, path: contents[0].path, status: contents[0].status, mode: contents[0].tool_mode } }));
