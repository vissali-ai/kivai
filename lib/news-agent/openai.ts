import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { newsAgentConfig } from "@/lib/blog/config";
import type { GeneratedArticle, NewsCandidate } from "@/lib/news-agent/types";

const articleSchema = z.object({
  title: z.string().min(15).max(110),
  subtitle: z.string().min(20).max(180),
  excerpt: z.string().min(80).max(320),
  contentHtml: z.string().min(800).max(14_000),
  categorySlug: z.enum(["noticias", "inteligencia-artificial", "tecnologia", "marketing", "e-commerce"]),
  tags: z.array(z.string().min(2).max(40)).min(2).max(8),
  seoTitle: z.string().min(15).max(70),
  metaDescription: z.string().min(80).max(170),
  referenceUrls: z.array(z.string().url()).min(1).max(6),
});

const editorialInstructions = `Você é o agente editorial do Blog do Kivai, em português do Brasil.
Produza uma matéria original e factual a partir da pauta recebida. Pesquise na web para confirmar os fatos importantes e, quando possível, consulte mais de uma fonte confiável.

Regras obrigatórias:
- Nunca copie nem faça paráfrase linha a linha da fonte.
- Não invente números, declarações, datas ou recursos. Se um dado não estiver confirmado, omita-o.
- Diferencie fatos confirmados de contexto ou análise.
- Escreva entre 500 e 900 palavras, com abertura direta, contexto, impacto prático e conclusão.
- Use somente HTML semântico simples: p, h2, h3, ul, ol, li, strong, em e a.
- Não inclua imagens. Não afirme que o Kivai realizou entrevistas ou testes que não realizou.
- Inclua no fim um h2 "Fontes consultadas" e uma lista de links para todas as referências.
- A matéria será salva como rascunho e revisada por uma pessoa antes de qualquer publicação.`;

export async function generateEditorialDraft(candidate: NewsCandidate): Promise<GeneratedArticle> {
  if (!newsAgentConfig.openAiApiKey) throw new Error("Configure OPENAI_API_KEY para gerar os rascunhos.");
  const client = new OpenAI({ apiKey: newsAgentConfig.openAiApiKey, timeout: 90_000, maxRetries: 2 });
  const response = await client.responses.parse({
    model: newsAgentConfig.model,
    store: false,
    reasoning: { effort: "low" },
    safety_identifier: "kivai-news-agent",
    tools: [{ type: "web_search" }],
    input: [
      { role: "system", content: editorialInstructions },
      {
        role: "user",
        content: `Prepare uma versão editorial para o Kivai usando esta pauta do RSS:
Fonte principal: ${candidate.sourceName}
URL principal: ${candidate.url}
Data informada: ${candidate.publishedAt ?? "não informada"}
Categoria sugerida: ${candidate.categorySlug}
Título do feed: ${candidate.title}
Resumo fornecido pelo feed: ${candidate.excerpt || "não fornecido"}`,
      },
    ],
    text: {
      format: zodTextFormat(articleSchema, "kivai_editorial_article"),
      verbosity: "medium",
    },
  });
  if (!response.output_parsed) throw new Error("A IA não retornou um rascunho estruturado.");
  return response.output_parsed;
}
