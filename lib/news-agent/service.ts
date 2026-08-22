import "server-only";

import { createHash } from "node:crypto";
import { newsAgentConfig } from "@/lib/blog/config";
import { listCategories, savePost } from "@/lib/blog/repository";
import { slugify } from "@/lib/blog/slug";
import { candidateEditorialRelevance, deduplicateNewsTopics, normalizedNewsTitle, rankEditorialCandidates } from "@/lib/news-agent/candidate-ranking";
import {
  claimNewsImport,
  completeNewsImport,
  createAgentRun,
  failNewsImport,
  finishAgentRun,
  listKnownContentHashes,
  listNewsSources,
} from "@/lib/news-agent/repository";
import { fetchNewsSource } from "@/lib/news-agent/source-collector";
import type { NewsAgentResult, NewsCandidate } from "@/lib/news-agent/types";

function contentHash(candidate: NewsCandidate) {
  return createHash("sha256").update(`${candidate.url}\n${normalizedNewsTitle(candidate.title)}`).digest("hex");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Falha desconhecida no agente editorial.";
}

function createSourceDraft(candidate: NewsCandidate) {
  return {
    title: candidate.title,
    subtitle: "",
    excerpt: "",
    contentHtml: "<p></p>",
    categorySlug: candidate.categorySlug,
    tags: [],
    seoTitle: "",
    metaDescription: "",
  };
}

export async function runNewsAgent(): Promise<NewsAgentResult> {
  const run = await createAgentRun();
  let sourcesChecked = 0;
  let itemsFound = 0;
  let draftsCreated = 0;
  let itemsSkipped = 0;
  const draftIds: string[] = [];

  try {
    const sources = (await listNewsSources()).filter((source) => source.enabled);
    if (!sources.length) throw new Error("Nenhuma fonte editorial ativa. Aplique as migrações do agente de notícias.");
    const results = await Promise.allSettled(sources.map(async (source) => {
      const items = await fetchNewsSource(source);
      return { source, items };
    }));
    sourcesChecked = sources.length;
    const successful = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    if (!successful.length) throw new Error("Nenhuma fonte editorial respondeu nesta execução.");

    const oldestAllowed = Date.now() - newsAgentConfig.maxAgeHours * 60 * 60 * 1000;
    const allCandidates = successful.flatMap(({ items }) => items).filter((candidate) =>
      !candidate.publishedAt || new Date(candidate.publishedAt).getTime() >= oldestAllowed,
    );
    itemsFound = allCandidates.length;
    const sorted = allCandidates.sort((left, right) =>
      new Date(right.publishedAt ?? 0).getTime() - new Date(left.publishedAt ?? 0).getTime(),
    );
    const ranked = rankEditorialCandidates(deduplicateNewsTopics(sorted));
    const topicUnique = ranked.map((item) => item.candidate);
    const hashes = new Map(topicUnique.map((candidate) => [candidate.url, contentHash(candidate)]));
    const known = await listKnownContentHashes([...hashes.values()]);
    const candidates = topicUnique
      .filter((candidate) => !known.has(hashes.get(candidate.url)!))
      .slice(0, newsAgentConfig.maxDrafts);
    itemsSkipped = Math.max(itemsFound - candidates.length, 0);

    const categories = await listCategories();
    for (const candidate of candidates) {
      const hash = hashes.get(candidate.url)!;
      const importId = await claimNewsImport(candidate, run.id, hash);
      if (!importId) { itemsSkipped += 1; continue; }
      try {
        const article = createSourceDraft(candidate);
        const category = categories.find((item) => item.slug === article.categorySlug)
          ?? categories.find((item) => item.slug === candidate.categorySlug);
        const post = await savePost({
          title: article.title,
          subtitle: article.subtitle,
          slug: slugify(article.title),
          excerpt: article.excerpt,
          content: article.contentHtml,
          status: "draft",
          author: "Kivai",
          sourceName: candidate.sourceName,
          sourceUrl: candidate.url,
          originalPublishedAt: candidate.publishedAt,
          categoryId: category?.id ?? null,
          coverMediaId: null,
          coverAlt: "",
          coverCaption: "",
          coverCredit: "",
          coverSource: "",
          coverSourceUrl: "",
          seoTitle: article.seoTitle,
          metaDescription: article.metaDescription,
          canonicalUrl: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
          relatedToolSlugs: [],
          featured: false,
          featuredOrder: null,
          origin: "rss-agent",
          reviewStatus: "collected",
          generationModel: "source-only",
          needsCover: true,
          primarySourceUrl: "",
          originalContribution: "",
          relevanceScore: candidateEditorialRelevance(candidate),
          reviewedBy: "",
          reviewedAt: null,
          scheduledAt: null,
          tagNames: article.tags,
        });
        if (!post) throw new Error("O rascunho não foi criado.");
        await completeNewsImport(importId, post.id);
        draftsCreated += 1;
        draftIds.push(post.id);
      } catch (error) {
        await failNewsImport(importId, errorMessage(error));
        itemsSkipped += 1;
      }
    }

    await finishAgentRun(run.id, { status: "completed", sourcesChecked, itemsFound, draftsCreated, itemsSkipped });
    return { runId: run.id, sourcesChecked, itemsFound, draftsCreated, itemsSkipped, draftIds };
  } catch (error) {
    await finishAgentRun(run.id, {
      status: "failed", sourcesChecked, itemsFound, draftsCreated, itemsSkipped, error: errorMessage(error),
    });
    throw error;
  }
}
