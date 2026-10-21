import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import { slugify } from "@/lib/blog/slug";

export type EditorialTopic = {
  id: string;
  slug: string;
  name: string;
  searchTerms: string;
  categorySlug: string;
  enabled: boolean;
  sortOrder: number;
};

type TopicRow = {
  id: string; slug: string; name: string; search_terms: string;
  category_slug: string; enabled: boolean; sort_order: number;
};

const categories = new Set(["tecnologia", "inteligencia-artificial", "marketing", "e-commerce", "noticias"]);

function mapTopic(t: TopicRow): EditorialTopic {
  return { id: t.id, slug: t.slug, name: t.name, searchTerms: t.search_terms,
    categorySlug: t.category_slug, enabled: t.enabled, sortOrder: t.sort_order };
}

export async function listEditorialTopics(): Promise<EditorialTopic[]> {
  const rows = await supabaseRest<TopicRow[]>("blog_ai_research_topics?select=*&order=sort_order.asc,name.asc");
  return rows.map(mapTopic);
}

export type EditorialTopicInput = {
  name: string; searchTerms: string; categorySlug: string; enabled: boolean;
};

function validInput(body: unknown): EditorialTopicInput {
  if (!body || typeof body !== "object") throw new Error("Dados do tema inválidos.");
  const obj = body as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim().slice(0, 80) : "";
  const searchTerms = typeof obj.searchTerms === "string" ? obj.searchTerms.trim().slice(0, 350) : "";
  const categorySlug = typeof obj.categorySlug === "string" ? obj.categorySlug : "";
  if (!name || !searchTerms || !categories.has(categorySlug)) throw new Error("Informe nome, termos de busca e categoria válidos.");
  return { name, searchTerms, categorySlug, enabled: obj.enabled !== false };
}

export async function createEditorialTopic(body: unknown) {
  const input = validInput(body);
  const slug = slugify(input.name);
  if (!slug) throw new Error("Nome do tema inválido.");
  const rows = await supabaseRest<TopicRow[]>("blog_ai_research_topics", {
    method: "POST", body: JSON.stringify({
      name: input.name, slug, search_terms: input.searchTerms,
      category_slug: input.categorySlug, enabled: input.enabled, sort_order: 100,
    }),
  });
  return mapTopic(rows[0]);
}

export async function updateEditorialTopic(id: string, body: unknown) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Identificador inválido.");
  const input = validInput(body);
  const rows = await supabaseRest<TopicRow[]>("blog_ai_research_topics?id=eq." + encodeURIComponent(id), {
    method: "PATCH", body: JSON.stringify({
      name: input.name, search_terms: input.searchTerms, category_slug: input.categorySlug, enabled: input.enabled,
    }),
  });
  if (!rows.length) throw new Error("Tema não encontrado.");
  return mapTopic(rows[0]);
}

export async function deleteEditorialTopic(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Identificador inválido.");
  await supabaseRest("blog_ai_research_topics?id=eq." + encodeURIComponent(id), { method: "DELETE" });
}
