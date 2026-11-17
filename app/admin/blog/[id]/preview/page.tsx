import { notFound } from "next/navigation";
import { ArticleView } from "@/components/blog/article-view";
import { getPostById } from "@/lib/blog/repository";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) { const post = await getPostById((await params).id); if (!post) notFound(); return <ArticleView post={post} preview sectionHref={post.publicationTarget === "kivai_streaming" ? "/noticias" : "/blog"} sectionLabel={post.publicationTarget === "kivai_streaming" ? "Notícias" : "Blog"} siteUrl={post.publicationTarget === "kivai_streaming" ? "https://streaming.kivai.com.br" : "https://www.kivai.com.br"} />; }
