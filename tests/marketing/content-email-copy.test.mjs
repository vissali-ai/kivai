import test from "node:test";
import assert from "node:assert/strict";
import { contentEmailSubject, adjustDigestCount, withoutRepeatedTitleHeading, pickFeaturedBlogPosts } from "../../lib/marketing/content-email-copy.ts";

test("single post includes its headline even with a generic stored subject", () => {
  assert.equal(contentEmailSubject("new_post", "Tem conteúdo novo e interessante no Kivai", "Google Ads: novidades de outubro"), "Nova publicação no blog do Kivai: Google Ads: novidades de outubro");
});
test("digest includes the chosen main headline", () => {
  assert.equal(contentEmailSubject("blog_digest", "Tem conteúdo novo e interessante no Kivai", "Novas ferramentas de SEO"), "Novidades no blog do Kivai: Novas ferramentas de SEO");
});
test("tool subject contains the real published tool name", () => {
  assert.equal(contentEmailSubject("new_tool", "Conheça nossas ferramentas", "Removedor de Metadados"), "Nova ferramenta no Kivai: Removedor de Metadados");
});
test("admin subjects using the title variable remain supported", () => {
  assert.equal(contentEmailSubject("new_post", "Confira: {{titulo}}", "Nova manchete"), "Confira: Nova manchete");
});
test("duplicate editorial heading is omitted from email body", () => {
  assert.equal(withoutRepeatedTitleHeading("<p>Introdução</p><h2>Matéria principal</h2><p>Corpo</p>", "Matéria principal"), "<p>Introdução</p><p>Corpo</p>");
  assert.equal(withoutRepeatedTitleHeading("<h2>Outra seção</h2>", "Matéria principal"), "<h2>Outra seção</h2>");
});
test("legacy digest copy has the right link count", () => {
  assert.equal(adjustDigestCount("Selecionamos três publicações recentes", 2), "Selecionamos 2 publicações recentes");
  assert.equal(adjustDigestCount("Selecionamos três publicações recentes", 3), "Selecionamos 3 publicações recentes");
});
test("editorial featured order outranks publication time", () => {
  const posts = [
    { id: "latest", featured: false, published_at: "2026-10-23T09:00:00Z" },
    { id: "lead", featured: true, featured_order: 1, published_at: "2026-10-22T09:00:00Z" },
    { id: "secondary", featured: true, featured_order: 3, published_at: "2026-10-23T08:00:00Z" },
  ];
  assert.deepEqual(pickFeaturedBlogPosts(posts).map(p => p.id), ["lead", "secondary", "latest"]);
});
