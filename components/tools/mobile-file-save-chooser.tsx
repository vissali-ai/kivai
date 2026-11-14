"use client";

import { useEffect, useState } from "react";
import { Download, Image, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SaveRequest = {
  href: string;
  name: string;
  blob: Blob | null;
  loading: boolean;
  error: string | null;
};

const MAX_SHARE_SIZE = 150 * 1024 * 1024;

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function fileNameFromResponse(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const value = encoded ? decodeURIComponent(encoded) : plain;
  return value || fallback;
}

function safeFallbackName(href: string) {
  try {
    const last = new URL(href, window.location.href).pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : "arquivo";
  } catch {
    return "arquivo";
  }
}

function downloadBlobDirect(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadUrlDirect(href: string, name: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function MobileFileSaveChooser() {
  const [request, setRequest] = useState<SaveRequest | null>(null);

  useEffect(() => {
    let activeRequest = 0;
    function interceptDownload(event: MouseEvent) {
      if (!isMobileDevice()) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;

      const href = target.href;
      const explicitName = target.download;
      const name = explicitName || safeFallbackName(href);
      let hasDownloadQuery = false;
      try {
        hasDownloadQuery = new URL(href, window.location.href).searchParams.get("download") === "true";
      } catch {
        // Invalid URLs fall through to the browser's normal behavior.
      }
      if (!target.hasAttribute("download") && !hasDownloadQuery) return;
      if (!window.location.pathname.startsWith("/ferramentas/") && !window.location.pathname.startsWith("/pdf/")) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const id = ++activeRequest;
      setRequest({ href, name, blob: null, loading: true, error: null });

      void (async () => {
        try {
          const response = await fetch(href, { cache: "no-store", credentials: "same-origin" });
          if (!response.ok) throw new Error("Não foi possível preparar o arquivo para compartilhamento.");

          const contentLength = Number(response.headers.get("content-length"));
          if (contentLength > MAX_SHARE_SIZE) {
            if (activeRequest === id) setRequest({ href, name, blob: null, loading: false, error: "Este arquivo é grande demais para preparar o compartilhamento no celular. Baixe-o e use o menu Compartilhar do aparelho." });
            return;
          }

          const blob = await response.blob();
          if (blob.size > MAX_SHARE_SIZE) {
            if (activeRequest === id) setRequest({ href, name, blob: null, loading: false, error: "Este arquivo é grande demais para preparar o compartilhamento no celular. Baixe-o e use o menu Compartilhar do aparelho." });
            return;
          }

          if (activeRequest === id) setRequest({ href, name: explicitName ? name : fileNameFromResponse(response, name), blob, loading: false, error: null });
        } catch {
          if (activeRequest === id) setRequest({ href, name, blob: null, loading: false, error: "Não foi possível preparar o compartilhamento. Você ainda pode baixar o arquivo normalmente." });
        }
      })();
    }

    document.addEventListener("click", interceptDownload, true);
    return () => {
      activeRequest++;
      document.removeEventListener("click", interceptDownload, true);
    };
  }, []);

  if (!request) return null;
  const currentRequest = request;

  const type = request.blob?.type || "application/octet-stream";
  const file = request.blob ? new File([request.blob], request.name, { type }) : null;
  const mediaFile = Boolean(file && (/^image\//i.test(type) || /^video\//i.test(type)));
  let canShareFile = false;
  if (file && typeof navigator.share === "function") {
    try {
      canShareFile = typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] });
    } catch {
      canShareFile = false;
    }
  }

  async function shareFile() {
    if (!file || !canShareFile) return;
    try {
      await navigator.share({ files: [file], title: currentRequest.name });
      setRequest(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setRequest((current) => current ? { ...current, error: "O celular não conseguiu compartilhar este arquivo. Você ainda pode baixá-lo." } : null);
    }
  }

  function saveToDevice() {
    if (currentRequest.blob) downloadBlobDirect(currentRequest.blob, currentRequest.name);
    else downloadUrlDirect(currentRequest.href, currentRequest.name);
    setRequest(null);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-5" role="presentation" onClick={() => setRequest(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="mobile-file-save-title" className="w-full max-w-lg rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="mobile-file-save-title" className="text-lg font-semibold">Como salvar este arquivo?</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">{request.name}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Fechar opções de salvamento" onClick={() => setRequest(null)}><X className="size-5" /></Button>
        </div>

        {request.loading && <p role="status" className="mt-5 rounded-lg bg-muted/40 p-4 text-sm">Preparando o arquivo para as opções de salvamento…</p>}
        {request.error && <p role="alert" className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">{request.error}</p>}
        {request.blob && canShareFile && (
          <Button type="button" size="lg" className="mt-5 w-full" onClick={() => void shareFile()}>
            {mediaFile ? <Image className="size-5" /> : <Share2 className="size-5" />}
            {mediaFile ? "Salvar na galeria" : "Compartilhar ou salvar em Arquivos"}
          </Button>
        )}
        {request.blob && mediaFile && !canShareFile && <p className="mt-4 text-sm text-muted-foreground">Este navegador não permite enviar a mídia diretamente à galeria. Baixe o arquivo e use o menu Compartilhar do aparelho.</p>}
        {request.blob && !mediaFile && !canShareFile && <p className="mt-4 text-sm text-muted-foreground">Para documentos, use o download ou o menu de compartilhamento do celular para salvar em Arquivos.</p>}

        <Button type="button" size="lg" variant={canShareFile ? "outline" : "default"} className="mt-3 w-full" onClick={saveToDevice}>
          <Download className="size-5" />Baixar arquivo
        </Button>
        {mediaFile && canShareFile && <p className="mt-3 text-center text-xs text-muted-foreground">A galeria abre pelo menu do celular; confirme “Salvar imagem” ou “Salvar vídeo” na próxima tela.</p>}
      </section>
    </div>
  );
}
