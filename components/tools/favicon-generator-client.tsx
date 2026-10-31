"use client";

import { openFilePicker } from "@/lib/browser/file-picker";
import Link from "next/link";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Copy, Download, Link2, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { getStoredSession } from "@/lib/user-auth";
import { useAccountAccess } from "@/lib/billing/access-client";
import { hostingLimit } from "@/lib/favicon/hosting";
import { createFaviconZip, generateFaviconAssets, type FaviconAsset } from "@/lib/favicon/engine";

const FORMATOS = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
type Props = { title: string; description: string; names: Record<number, string>; showAll: boolean };

export function FaviconGeneratorClient({ title, description, names, showAll }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const generatedUrlsRef = useRef<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assets, setAssets] = useState<FaviconAsset[]>([]);
  const [ico, setIco] = useState<{ blob: Blob; url: string } | null>(null);
  const {access} = useAccountAccess();
  const [hosting, setHosting] = useState(false);
  const [hostedFiles, setHostedFiles] = useState<Array<{id:string;public_url:string;byte_size:number}>>([]);
  const [refreshingFiles, setRefreshingFiles] = useState(false);
  const [hostedUrl, setHostedUrl] = useState("");
  const [hostingError, setHostingError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const download = (url: string, name: string) => { const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); };
  const select = (event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0]; if (!selected) return; if (!FORMATOS.includes(selected.type)) { setError("Use uma imagem PNG, JPG ou WebP."); return; } if (selected.size > MAX_IMAGE_SIZE) { setError("A imagem deve ter no máximo 20 MB."); return; } generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); generatedUrlsRef.current = []; if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); const nextPreview = URL.createObjectURL(selected); previewUrlRef.current = nextPreview; setFile(selected); setPreview(nextPreview); setAssets([]); setIco(null); setHostedUrl(""); setHostingError(""); setError(""); };
  const generate = async () => { if (!file) return; setLoading(true); setError(""); try { const result = await generateFaviconAssets(file, names); generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); generatedUrlsRef.current = [...result.assets.map((asset) => asset.url), result.icoUrl]; setAssets(result.assets); setIco({ blob: result.icoBlob, url: result.icoUrl }); setHostedUrl(""); setHostingError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar os favicons."); } finally { setLoading(false); } };
  const refreshHosted = async () => {
    const session = getStoredSession();
    if (!session?.access_token) return;
    setRefreshingFiles(true);
    try {
      const response = await fetch("/api/favicon/hosting", {headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
      if (response.ok) { const data = await response.json() as {files:Array<{id:string;public_url:string;byte_size:number}>}; setHostedFiles(data.files ?? []); }
    } finally { setRefreshingFiles(false); }
  };
  const removeHosted = async (id:string) => {
    if (!window.confirm("Excluir o favicon hospedado? O link deixará de funcionar nos sites que o utilizam.")) return;
    const token = getStoredSession()?.access_token;
    if (!token) return;
    const response = await fetch(`/api/favicon/hosting?id=${encodeURIComponent(id)}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    if (!response.ok) { setHostingError("Não foi possível excluir o favicon."); return; }
    await refreshHosted();
  };
  const host = async () => {
    if (!ico || hosting) return;
    setHostingError("");
    const session = getStoredSession();
    if (!session?.access_token) { setHostingError("Entre na sua conta para receber um link público."); return; }
    const max = hostingLimit(access?.plan ?? "free").maxBytes;
    if (ico.blob.size > max) { setHostingError(`O ICO tem ${(ico.blob.size/1024).toFixed(1)} KB e ultrapassa seu limite de ${max/1024} KB. Baixe o arquivo normalmente ou escolha um plano superior.`); return; }
    setHosting(true);
    try {
      const form = new FormData();
      form.set("favicon", ico.blob, "favicon.ico");
      const res = await fetch("/api/favicon/hosting", {method:"POST",headers:{Authorization:`Bearer ${session.access_token}`},body:form});
      const data = await res.json() as {url?:string;error?:string};
      if (!res.ok || !data.url) throw new Error(data.error ?? "Falha na hospedagem.");
      setHostedUrl(data.url);
      await refreshHosted();
    } catch(e) { setHostingError(e instanceof Error ? e.message : "Não foi possível hospedar."); }
    finally { setHosting(false); }
  };
  const downloadZip = async () => { if (!ico) return; const zip = await createFaviconZip(assets, ico.blob); const url = URL.createObjectURL(zip); download(url, "favicons.zip"); setTimeout(() => URL.revokeObjectURL(url), 0); };

  return <ImageToolPageShell title={title} description={description} showPrivacyNotice={false}>
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Área de geração</CardTitle><CardDescription>Envie uma imagem PNG, JPG ou WebP para gerar os ícones.</CardDescription></CardHeader><CardContent>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={select} />
      {!preview ? <div className="flex min-h-80 flex-col items-center justify-center border border-dashed border-border bg-muted/20 p-6 text-center sm:p-10"><div className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></div><h2 className="mt-5 font-heading text-lg font-medium">Envie sua imagem</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Arraste e solte ou selecione uma imagem do seu dispositivo.</p><Button size="lg" className="mt-6" onClick={() => openFilePicker(inputRef.current)}>Selecionar imagem</Button></div> : <div className="w-full"><div className="grid gap-5 sm:grid-cols-[180px_1fr]"><div className="flex min-h-40 items-center justify-center border border-border bg-background p-4"><img src={preview} alt="Imagem selecionada" className="max-h-40 max-w-full object-contain" /></div><div className="border border-border bg-background p-4"><p className="truncate text-sm font-medium">{file?.name}</p><p className="mt-1 text-xs text-muted-foreground">{file && (file.size / 1024 / 1024).toFixed(2)} MB</p><div className="mt-5 flex flex-wrap gap-3"><Button onClick={generate} disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" />Gerando...</> : "Gerar favicons"}</Button><Button variant="outline" onClick={() => openFilePicker(inputRef.current)} disabled={loading}>Trocar imagem</Button></div></div></div>
      {ico && <div className="mt-6 border-t border-border pt-6"><div className="flex flex-wrap gap-3"><Button onClick={() => download(ico.url, "favicon.ico")}><Download />Baixar favicon.ico</Button><Button variant="outline" onClick={downloadZip}><Download />Baixar ZIP</Button><Button variant="outline" onClick={host} disabled={hosting}>{hosting ? <LoaderCircle className="animate-spin" /> : <Link2 />}Gerar link para site</Button></div>
      <p className="mt-3 text-xs text-muted-foreground">Hospedagem mediante login: Grátis até 5 arquivos de 100 KB; Pro até 100 arquivos de 500 KB; Agency sem limite de quantidade e até 500 KB por arquivo, sujeito à política de uso justo. Downloads locais permanecem gratuitos.</p>
      {access?.userId && <div className="mt-4 space-y-2"><Button type="button" variant="outline" size="sm" disabled={refreshingFiles} onClick={refreshHosted}>Ver minhas hospedagens</Button>{hostedFiles.length > 0 && <ul className="space-y-2">{hostedFiles.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-border p-2 text-xs"><a href={item.public_url} target="_blank" rel="noopener noreferrer" className="max-w-[75%] break-all underline">{item.public_url}</a><Button size="xs" variant="outline" onClick={() => void removeHosted(item.id)}>Excluir</Button></li>)}</ul>}</div>}
      {hostingError && <p role="alert" className="mt-3 text-sm text-destructive">{hostingError} {hostingError.startsWith("Entre na sua conta") ? <Link className="underline" href="/conta/login?next=%2Fferramentas%2Fgerador-de-favicon">Entrar na conta</Link> : <Link className="underline" href="/planos">Ver planos</Link>}</p>}
      {hostedUrl && <div className="mt-4 space-y-3 border border-border bg-muted/20 p-4"><p className="text-sm font-medium">Favicon hospedado. Copie o link ou adicione o código ao head do site.</p><div className="flex flex-wrap items-center gap-2"><code className="max-w-full break-all text-xs">{hostedUrl}</code><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(hostedUrl)}><Copy />Copiar URL</Button></div><code className="block break-all text-xs">{`<link rel="icon" type="image/x-icon" href="${hostedUrl}">`}</code><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`<link rel="icon" type="image/x-icon" href="${hostedUrl}">`)}><Copy />Copiar HTML</Button></div>}<div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">{assets.map((asset) => <div key={asset.name} className="border border-border bg-muted/20 p-3 text-center"><div className="flex h-24 items-center justify-center bg-muted p-2"><img src={asset.url} alt={`Preview ${asset.size} por ${asset.size}`} className="max-h-full max-w-full" /></div><p className="mt-2 text-xs font-medium">{asset.size}×{asset.size}</p><Button className="mt-2 w-full" size="xs" variant="outline" onClick={() => download(asset.url, asset.name)}>Baixar</Button></div>)}</div>{showAll && <p className="mt-5 text-sm text-muted-foreground">Inclui ícones para navegador, Apple Touch e Android Chrome.</p>}</div>}</div>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </CardContent></Card>
  </ImageToolPageShell>;
}
