"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, EyeOff, MessageCircle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type MusicComment = {
  id: string;
  author_name: string;
  content: string;
  status: "pending" | "published" | "hidden";
  created_at: string;
  artist?: { name: string; slug: string };
};
const statusNames = { pending: "Aguardando revisão", published: "Publicado", hidden: "Oculto" };

export function MusicCommentsAdmin() {
  const [comments, setComments] = useState<MusicComment[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/music/comments", { cache: "no-store" });
      const result = await response.json() as { comments?: MusicComment[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar comentários.");
      setComments(result.comments ?? []);
      setMessage("");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar comentários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/music/comments", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { comments?: MusicComment[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Não foi possível carregar comentários.");
        if (active) { setComments(result.comments ?? []); setMessage(""); }
      })
      .catch((cause: unknown) => { if (active) setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar comentários."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function update(comment: MusicComment, status: MusicComment["status"] | "delete") {
    setBusyId(comment.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/music/comments", {
        method: status === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "delete" ? { id: comment.id } : { id: comment.id, status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível atualizar o comentário.");
      await refresh();
      setMessage(status === "delete" ? "Comentário excluído." : `Comentário ${status === "published" ? "publicado" : status === "hidden" ? "ocultado" : "movido para revisão"}.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível atualizar o comentário.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="mt-8 border border-border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /><h2 className="text-xl font-semibold">Comentários de ouvintes</h2></div><p className="mt-1 text-sm text-muted-foreground">Revise, publique ou oculte os comentários antes que apareçam nas páginas públicas dos artistas.</p></div><Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className="size-4" />Atualizar</Button></div>
    {message ? <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    {loading ? <p className="mt-4 text-sm text-muted-foreground">Carregando...</p> : comments.length ? <div className="mt-4 space-y-3">{comments.map((comment) => <article key={comment.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{comment.author_name}</p><p className="mt-1 text-xs text-muted-foreground">{comment.artist?.name ?? "Artista"} · {new Date(comment.created_at).toLocaleString("pt-BR")} · {statusNames[comment.status]}</p></div><div className="flex flex-wrap gap-2">{comment.status !== "published" ? <Button type="button" size="sm" onClick={() => void update(comment, "published")} disabled={busyId === comment.id}><Check className="size-4" />Publicar</Button> : <Button type="button" size="sm" variant="outline" onClick={() => void update(comment, "hidden")} disabled={busyId === comment.id}><EyeOff className="size-4" />Ocultar</Button>}{comment.status !== "pending" ? <Button type="button" size="sm" variant="outline" onClick={() => void update(comment, "pending")} disabled={busyId === comment.id}>Revisar</Button> : null}<Button type="button" size="sm" variant="destructive" onClick={() => { if (window.confirm("Excluir este comentário definitivamente?")) void update(comment, "delete"); }} disabled={busyId === comment.id}><Trash2 className="size-4" />Excluir</Button></div></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p></article>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Ainda não há comentários enviados.</p>}
  </section>;
}
