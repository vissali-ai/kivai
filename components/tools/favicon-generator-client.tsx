"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { createFaviconZip, generateFaviconAssets, type FaviconAsset } from "@/lib/favicon/engine";

const FORMATOS = ["image/png", "image/jpeg", "image/webp"];
type Props = { title: string; description: string; names: Record<number, string>; showAll: boolean };

export function FaviconGeneratorClient({ title, description, names, showAll }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assets, setAssets] = useState<FaviconAsset[]>([]);
  const [ico, setIco] = useState<{ blob: Blob; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); assets.forEach((asset) => URL.revokeObjectURL(asset.url)); if (ico) URL.revokeObjectURL(ico.url); }, [preview, assets, ico]);
  const download = (url: string, name: string) => { const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); };
  const select = (event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0]; if (!selected) return; if (!FORMATOS.includes(selected.type)) { setError("Use uma imagem PNG, JPG ou WebP."); return; } assets.forEach((asset) => URL.revokeObjectURL(asset.url)); if (ico) URL.revokeObjectURL(ico.url); if (preview) URL.revokeObjectURL(preview); setFile(selected); setPreview(URL.createObjectURL(selected)); setAssets([]); setIco(null); setError(""); };
  const generate = async () => { if (!file) return; setLoading(true); setError(""); try { const result = await generateFaviconAssets(file, names); setAssets(result.assets); setIco({ blob: result.icoBlob, url: result.icoUrl }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar os favicons."); } finally { setLoading(false); } };
  const downloadZip = async () => { if (!ico) return; const zip = await createFaviconZip(assets, ico.blob); download(URL.createObjectURL(zip), "favicons.zip"); };

  return <ImageToolPageShell title={title} description={`${description} Todo o processamento acontece no seu navegador.`}>
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Área de geração</CardTitle><CardDescription>Envie uma imagem PNG, JPG ou WebP para gerar os ícones.</CardDescription></CardHeader><CardContent>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={select} />
      {!preview ? <div className="flex min-h-80 flex-col items-center justify-center border border-dashed border-border bg-muted/20 p-6 text-center sm:p-10"><div className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></div><h2 className="mt-5 font-heading text-lg font-medium">Envie sua imagem</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Arraste e solte ou selecione uma imagem do seu dispositivo.</p><Button size="lg" className="mt-6" onClick={() => openFilePicker(inputRef.current)}>Selecionar imagem</Button></div> : <div className="w-full"><div className="grid gap-5 sm:grid-cols-[180px_1fr]"><div className="flex min-h-40 items-center justify-center border border-border bg-background p-4"><img src={preview} alt="Imagem selecionada" className="max-h-40 max-w-full object-contain" /></div><div className="border border-border bg-background p-4"><p className="truncate text-sm font-medium">{file?.name}</p><p className="mt-1 text-xs text-muted-foreground">{file && (file.size / 1024 / 1024).toFixed(2)} MB</p><div className="mt-5 flex flex-wrap gap-3"><Button onClick={generate} disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" />Gerando...</> : "Gerar favicons"}</Button><Button variant="outline" onClick={() => openFilePicker(inputRef.current)} disabled={loading}>Trocar imagem</Button></div></div></div>
      {ico && <div className="mt-6 border-t border-border pt-6"><div className="flex flex-wrap gap-3"><Button onClick={() => download(ico.url, "favicon.ico")}><Download />Baixar favicon.ico</Button><Button variant="outline" onClick={downloadZip}><Download />Baixar ZIP</Button></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">{assets.map((asset) => <div key={asset.name} className="border border-border bg-muted/20 p-3 text-center"><div className="flex h-24 items-center justify-center bg-muted p-2"><img src={asset.url} alt={`Preview ${asset.size} por ${asset.size}`} className="max-h-full max-w-full" /></div><p className="mt-2 text-xs font-medium">{asset.size}×{asset.size}</p><Button className="mt-2 w-full" size="xs" variant="outline" onClick={() => download(asset.url, asset.name)}>Baixar</Button></div>)}</div>{showAll && <p className="mt-5 text-sm text-muted-foreground">Inclui ícones para navegador, Apple Touch e Android Chrome.</p>}</div>}</div>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </CardContent></Card>
  </ImageToolPageShell>;
}
