"use client";

import JSZip from "jszip";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Download, ImageIcon, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { calcularDimensoes, type DimensoesImagem, type FormatoSaida, obterDimensoesImagem, redimensionarImagem } from "./resize-utils";

const TAMANHO_MAXIMO = 20 * 1024 * 1024;
const FORMATOS_ACEITOS = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.svg,image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

type ItemImagem = {
  id: string;
  arquivo: File;
  previewUrl: string;
  original: DimensoesImagem;
};

type Resultado = {
  id: string;
  arquivo: File;
  blob: Blob;
  url: string;
  largura: number;
  altura: number;
  nome: string;
};

function formatarTamanho(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function nomeSemExtensao(nome: string) {
  return nome.replace(/\.[^/.]+$/, "");
}

export default function RedimensionarImagemClient() {
  const inputId = useId();
  const addInputId = useId();
  const [itens, setItens] = useState<ItemImagem[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [modo, setModo] = useState<"pixels" | "porcentagem">("pixels");
  const [largura, setLargura] = useState(1080);
  const [altura, setAltura] = useState(1080);
  const [porcentagem, setPorcentagem] = useState(50);
  const [manterProporcao, setManterProporcao] = useState(true);
  const [naoAmpliar, setNaoAmpliar] = useState(true);
  const [formato, setFormato] = useState<FormatoSaida>("jpeg");
  const [qualidade, setQualidade] = useState(90);
  const [arrastando, setArrastando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const itensRef = useRef<ItemImagem[]>([]);
  const resultadosRef = useRef<Resultado[]>([]);

  useEffect(() => { itensRef.current = itens; }, [itens]);
  useEffect(() => { resultadosRef.current = resultados; }, [resultados]);
  useEffect(() => () => {
    itensRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    resultadosRef.current.forEach((item) => URL.revokeObjectURL(item.url));
  }, []);

  const dimensoesPrevistas = useMemo(() => itens.map((item) => {
    try {
      return calcularDimensoes(item.original, {
        largura: modo === "pixels" ? largura : undefined,
        altura: modo === "pixels" ? altura : undefined,
        porcentagem: modo === "porcentagem" ? porcentagem : undefined,
        manterProporcao,
        naoAmpliar,
      });
    } catch {
      return null;
    }
  }), [altura, itens, largura, manterProporcao, modo, naoAmpliar, porcentagem]);

  function limparResultados() {
    resultados.forEach((item) => URL.revokeObjectURL(item.url));
    setResultados([]);
  }

  async function adicionarArquivos(arquivos: File[]) {
    setErro("");
    limparResultados();
    const novos: ItemImagem[] = [];

    for (const arquivo of arquivos) {
      const tipoAceito = FORMATOS_ACEITOS.includes(arquivo.type) || /\.(png|jpe?g|webp|gif|svg)$/i.test(arquivo.name);
      if (!tipoAceito) {
        setErro("Use imagens JPG, PNG, WebP, GIF ou SVG.");
        continue;
      }
      if (arquivo.size > TAMANHO_MAXIMO) {
        setErro(`“${arquivo.name}” ultrapassa o limite de 20 MB.`);
        continue;
      }
      try {
        novos.push({
          id: `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}-${crypto.randomUUID()}`,
          arquivo,
          previewUrl: URL.createObjectURL(arquivo),
          original: await obterDimensoesImagem(arquivo),
        });
      } catch {
        setErro(`Não foi possível abrir “${arquivo.name}”.`);
      }
    }

    setItens((atuais) => [...atuais, ...novos]);
  }

  function removerItem(id: string) {
    limparResultados();
    setItens((atuais) => {
      const removido = atuais.find((item) => item.id === id);
      if (removido) URL.revokeObjectURL(removido.previewUrl);
      return atuais.filter((item) => item.id !== id);
    });
  }

  function limparTudo() {
    itens.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    limparResultados();
    setItens([]);
    setErro("");
  }

  async function processar() {
    if (!itens.length) return;
    setProcessando(true);
    setErro("");
    limparResultados();
    const concluidos: Resultado[] = [];

    try {
      for (const item of itens) {
        const resultado = await redimensionarImagem(item.arquivo, {
          largura: modo === "pixels" ? largura : undefined,
          altura: modo === "pixels" ? altura : undefined,
          porcentagem: modo === "porcentagem" ? porcentagem : undefined,
          manterProporcao,
          naoAmpliar,
          formato,
          qualidade: qualidade / 100,
          corDeFundo: "#ffffff",
        });
        const nome = `${nomeSemExtensao(item.arquivo.name)}-${resultado.largura}x${resultado.altura}.${resultado.extensao}`;
        concluidos.push({ id: item.id, arquivo: item.arquivo, blob: resultado.blob, url: URL.createObjectURL(resultado.blob), largura: resultado.largura, altura: resultado.altura, nome });
      }
      setResultados(concluidos);
    } catch (error) {
      concluidos.forEach((item) => URL.revokeObjectURL(item.url));
      setErro(error instanceof Error ? error.message : "Não foi possível redimensionar as imagens.");
    } finally {
      setProcessando(false);
    }
  }

  function baixar(resultado: Resultado) {
    const link = document.createElement("a");
    link.href = resultado.url;
    link.download = resultado.nome;
    link.click();
  }

  async function baixarTudo() {
    if (resultados.length === 1) return baixar(resultados[0]);
    const zip = new JSZip();
    resultados.forEach((resultado) => zip.file(resultado.nome, resultado.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "imagens-redimensionadas.zip";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pb-16">
        <Link href="/ferramentas/imagens" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">← Voltar para ferramentas de imagens</Link>

        <header className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de imagem</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Redimensionar imagens</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Redimensione JPG, PNG, WebP, GIF ou SVG por pixels ou porcentagem. Processe várias imagens de uma vez no seu dispositivo.</p>
        </header>

        {!itens.length ? (
          <div
            onDragEnter={(event) => { event.preventDefault(); setArrastando(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setArrastando(false); }}
            onDrop={(event) => { event.preventDefault(); setArrastando(false); void adicionarArquivos(Array.from(event.dataTransfer.files)); }}
            className={cn("mx-auto flex min-h-80 max-w-4xl flex-col items-center justify-center border border-dashed px-5 py-12 text-center transition-colors", arrastando ? "border-primary bg-primary/10" : "border-border bg-card")}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary"><Upload className="size-7" /></span>
            <h2 className="mt-5 font-heading text-xl font-semibold">Selecione suas imagens</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Escolha uma ou várias imagens da galeria, do app Arquivos ou do computador.</p>
            <input id={inputId} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(event) => { void adicionarArquivos(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
            <label htmlFor={inputId} className={cn(buttonVariants({ size: "lg" }), "mt-6 min-h-12 cursor-pointer px-6 text-sm")}>Selecionar imagens</label>
            <p className="mt-4 hidden text-xs text-muted-foreground sm:block">ou arraste e solte as imagens aqui</p>
            <p className="mt-2 text-xs text-muted-foreground">Até 20 MB por arquivo</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div><CardTitle>{itens.length} {itens.length === 1 ? "imagem selecionada" : "imagens selecionadas"}</CardTitle><CardDescription>Confira as dimensões previstas antes de processar.</CardDescription></div>
                <div className="flex gap-2">
                  <input id={addInputId} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(event) => { void adicionarArquivos(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
                  <label htmlFor={addInputId} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 cursor-pointer sm:min-h-7")}><Plus />Adicionar</label>
                  <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-7" onClick={limparTudo}><Trash2 />Limpar</Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {itens.map((item, indice) => (
                  <article key={item.id} className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3 border border-border bg-background p-3">
                    <img src={item.previewUrl} alt="" className="size-[88px] bg-muted/20 object-contain" />
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.arquivo.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.original.largura} × {item.original.altura}px · {formatarTamanho(item.arquivo.size)}</p>{dimensoesPrevistas[indice] && <p className="mt-1 text-xs font-medium text-primary">Resultado: {dimensoesPrevistas[indice]?.largura} × {dimensoesPrevistas[indice]?.altura}px</p>}</div>
                    <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`Remover ${item.arquivo.name}`} onClick={() => removerItem(item.id)}><Trash2 /></Button>
                  </article>
                ))}
              </CardContent>
            </Card>

            <Card className="h-fit lg:sticky lg:top-24">
              <CardHeader><CardTitle>Opções de redimensionamento</CardTitle><CardDescription>As mesmas opções são aplicadas a todas as imagens.</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 border border-border p-1">
                  <Button type="button" variant={modo === "pixels" ? "default" : "ghost"} className="min-h-11" onClick={() => { setModo("pixels"); limparResultados(); }}>Por pixels</Button>
                  <Button type="button" variant={modo === "porcentagem" ? "default" : "ghost"} className="min-h-11" onClick={() => { setModo("porcentagem"); limparResultados(); }}>Por porcentagem</Button>
                </div>

                {modo === "pixels" ? <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium">Largura (px)<input inputMode="numeric" type="number" min={1} value={largura} onChange={(event) => { setLargura(Number(event.target.value)); limparResultados(); }} className="mt-2 h-12 w-full border border-input bg-background px-3 text-base" /></label>
                  <label className="text-xs font-medium">Altura (px)<input inputMode="numeric" type="number" min={1} value={altura} onChange={(event) => { setAltura(Number(event.target.value)); limparResultados(); }} className="mt-2 h-12 w-full border border-input bg-background px-3 text-base" /></label>
                </div> : <div className="mt-5 grid grid-cols-3 gap-2">{[25, 50, 75].map((valor) => <Button key={valor} type="button" variant={porcentagem === valor ? "default" : "outline"} className="min-h-11" onClick={() => { setPorcentagem(valor); limparResultados(); }}>{valor}% menor</Button>)}</div>}

                {modo === "pixels" && <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={manterProporcao} onChange={(event) => { setManterProporcao(event.target.checked); limparResultados(); }} className="size-5 accent-[var(--primary)]" />Manter proporção</label>}
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={naoAmpliar} onChange={(event) => { setNaoAmpliar(event.target.checked); limparResultados(); }} className="size-5 accent-[var(--primary)]" />Não ampliar imagens menores</label>

                <label className="mt-4 block text-xs font-medium">Formato de saída<select value={formato} onChange={(event) => { setFormato(event.target.value as FormatoSaida); limparResultados(); }} className="mt-2 h-12 w-full border border-input bg-background px-3 text-base"><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></label>
                {formato !== "png" && <label className="mt-4 block text-xs font-medium">Qualidade: {qualidade}%<input type="range" min={10} max={100} step={5} value={qualidade} onChange={(event) => { setQualidade(Number(event.target.value)); limparResultados(); }} className="mt-3 h-6 w-full" /></label>}

                <Button type="button" size="lg" className="mt-6 min-h-12 w-full text-sm" disabled={processando} onClick={processar}>{processando ? <><LoaderCircle className="animate-spin" />Redimensionando...</> : <><ImageIcon />Redimensionar imagens</>}</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {erro && <p role="alert" className="mx-auto mt-4 max-w-4xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{erro}</p>}

        {!!resultados.length && <section aria-labelledby="resultados-titulo" className="mt-8 border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Concluído</p><h2 id="resultados-titulo" className="mt-1 font-heading text-xl font-semibold">{resultados.length} {resultados.length === 1 ? "imagem pronta" : "imagens prontas"}</h2></div><Button type="button" size="lg" className="min-h-12" onClick={() => void baixarTudo()}><Download />{resultados.length === 1 ? "Baixar imagem" : "Baixar tudo em ZIP"}</Button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{resultados.map((resultado) => <article key={resultado.id} className="border border-border bg-background p-3"><img src={resultado.url} alt={`Resultado de ${resultado.arquivo.name}`} className="aspect-video w-full bg-muted/20 object-contain" /><p className="mt-3 truncate text-sm font-medium">{resultado.nome}</p><p className="mt-1 text-xs text-muted-foreground">{resultado.largura} × {resultado.altura}px · {formatarTamanho(resultado.blob.size)}</p><Button type="button" variant="outline" className="mt-3 min-h-11 w-full" onClick={() => baixar(resultado)}><Download />Baixar</Button></article>)}</div>
        </section>}

        <div className="mx-auto mt-8 max-w-5xl"><AdSlot variant="banner" /></div>
      </div>
    </section>
  );
}
