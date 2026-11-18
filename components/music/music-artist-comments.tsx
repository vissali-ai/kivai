"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMusicPlayer } from "@/components/music/music-player-provider";
import { MessageCircle, Send, UserRound } from "lucide-react";
import { getCurrentUser, getStoredSession } from "@/lib/user-auth";

type Comment = { id: string; author_name: string; content: string; created_at: string };
type CommentResponse = { comments?: Comment[]; error?: string };

export function MusicArtistComments({ artistSlug }: { artistSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const { isStreamingHost } = useMusicPlayer();
  const returnPath = isStreamingHost ? `/${artistSlug}` : `/musica/${artistSlug}`;
  const loginHref = `/conta/login?next=${encodeURIComponent(returnPath)}`;
  const signupHref = `/conta/cadastro?next=${encodeURIComponent(returnPath)}`;

  async function refresh() {
    try {
      const response = await fetch(`/api/music/${encodeURIComponent(artistSlug)}/comments`, { cache: "no-store" });
      const result = await response.json() as CommentResponse;
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar os comentários.");
      setComments(result.comments ?? []);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar os comentários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const session = getStoredSession();
    void getCurrentUser(session).then((user) => { if (active) setSignedIn(Boolean(user?.id)); }).catch(() => { if (active) setSignedIn(false); });
    void fetch(`/api/music/${encodeURIComponent(artistSlug)}/comments`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as CommentResponse;
        if (!response.ok) throw new Error(result.error || "Não foi possível carregar os comentários.");
        if (active) setComments(result.comments ?? []);
      })
      .catch((cause: unknown) => { if (active) setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar os comentários."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [artistSlug]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getStoredSession()?.access_token;
    if (!token) { setSignedIn(false); setMessage("Entre na sua conta para comentar."); return; }
    if (content.trim().length < 3 || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/music/${encodeURIComponent(artistSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar o comentário.");
      setContent("");
      setMessage(result.message || "Comentário enviado para revisão.");
      await refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível enviar o comentário.");
    } finally {
      setBusy(false);
    }
  }

  return <section id="comentarios" className="mt-10 scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="music-comments-title">
    <div className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /><h2 id="music-comments-title" className="text-xl font-semibold">Comentários</h2></div>
    {signedIn ? <form onSubmit={submit} className="mt-5 space-y-3">
      <label htmlFor="music-comment" className="sr-only">Escreva seu comentário</label>
      <textarea id="music-comment" value={content} onChange={(event) => setContent(event.target.value.slice(0, 1000))} maxLength={1000} minLength={3} required rows={4} placeholder="Escreva um comentário..." className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{content.length}/1.000 · comentários são revisados antes da publicação</span><button type="submit" disabled={busy || content.trim().length < 3} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Send className="size-4" />{busy ? "Enviando..." : "Enviar comentário"}</button></div>
    </form> : <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4"><p className="text-sm">Entre na sua conta para comentar.</p><div className="mt-3 flex flex-wrap gap-2"><Link href={loginHref} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><UserRound className="size-4" />Entrar</Link><Link href={signupHref} className="inline-flex min-h-10 items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Criar conta</Link></div></div>}
    {message ? <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="text-sm font-semibold">Comentários publicados{comments.length ? ` (${comments.length})` : ""}</h3>
      {loading ? <p className="mt-3 text-sm text-muted-foreground">Carregando comentários...</p> : comments.length ? <ul className="mt-3 divide-y divide-border">{comments.map((comment) => <li key={comment.id} className="py-4 first:pt-1"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="text-sm font-semibold">{comment.author_name}</p><time className="text-xs text-muted-foreground" dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString("pt-BR")}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{comment.content}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Ainda não há comentários. Seja o primeiro.</p>}
    </div>
  </section>;
}
