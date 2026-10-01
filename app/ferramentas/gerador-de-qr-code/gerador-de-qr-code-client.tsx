"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  QrCode,
} from "lucide-react";

import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPrivacyNotice } from "@/components/tools/tool-privacy-notice";
import { ToolProcessingStatus } from "@/components/tools/tool-processing-status";
import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TIPOS, NIVEIS_CORRECAO, MODELOS_QR_CODE } from "./qr-config";
import { useQrCode } from "./use-qr-code";
import { QrContentFields } from "./qr-content-fields";
import { SavedProjects } from "@/components/account/saved-projects";

export default function GeradorDeQrCodeClient() {
  const qr = useQrCode();
  const project = { tipo: qr.tipo, url: qr.url, texto: qr.texto, whatsappNumero: qr.whatsappNumero, whatsappMensagem: qr.whatsappMensagem, telefone: qr.telefone, emailDestino: qr.emailDestino, emailAssunto: qr.emailAssunto, emailMensagem: qr.emailMensagem, wifiNome: qr.wifiNome, wifiSenha: qr.wifiSenha, wifiSeguranca: qr.wifiSeguranca, wifiOculta: qr.wifiOculta, corQr: qr.corQr, corFundo: qr.corFundo, tamanho: qr.tamanho, margem: qr.margem, nivelCorrecao: qr.nivelCorrecao, modeloVisual: qr.modeloVisual, chamada: qr.chamada, nomeMarca: qr.nomeMarca, logoDataUrl: qr.logoDataUrl.length <= 300000 ? qr.logoDataUrl : "" };
  function loadProject(payload: unknown) {
    const saved = payload as typeof project;
    qr.setTipo(saved.tipo); qr.setUrl(saved.url); qr.setTexto(saved.texto);
    qr.setWhatsappNumero(saved.whatsappNumero); qr.setWhatsappMensagem(saved.whatsappMensagem); qr.setTelefone(saved.telefone);
    qr.setEmailDestino(saved.emailDestino); qr.setEmailAssunto(saved.emailAssunto); qr.setEmailMensagem(saved.emailMensagem);
    qr.setWifiNome(saved.wifiNome); qr.setWifiSenha(saved.wifiSenha); qr.setWifiSeguranca(saved.wifiSeguranca); qr.setWifiOculta(saved.wifiOculta);
    qr.setCorQr(saved.corQr); qr.setCorFundo(saved.corFundo); qr.setTamanho(saved.tamanho); qr.setMargem(saved.margem); qr.setNivelCorrecao(saved.nivelCorrecao); qr.setModeloVisual(saved.modeloVisual);
    qr.setChamada(saved.chamada); qr.setNomeMarca(saved.nomeMarca); qr.setLogoDataUrl(saved.logoDataUrl);
  }
  const {
    tipo,
    corQr,
    setCorQr,
    corFundo,
    setCorFundo,
    tamanho,
    setTamanho,
    margem,
    setMargem,
    nivelCorrecao,
    setNivelCorrecao,
    modeloVisual,
    chamada,
    setChamada,
    nomeMarca,
    setNomeMarca,
    logoDataUrl,
    setLogoDataUrl,
    qrDataUrl,
    gerando,
    copiado,
    erro,
    arteSvg,
    arteDataUrl,
    conteudoQr,
    trocarTipo,
    aplicarModelo,
    carregarLogo,
    copiarConteudo,
    baixarPng,
    baixarSvg,
  } = qr;

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-12 sm:px-6 sm:pt-24 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="mb-8">
          <Link
            href="/ferramentas/imagens"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />
            Voltar para ferramentas
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Compartilhamento rápido
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Gerador de QR Code
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Crie QR Codes para links, textos, Wi-Fi, e-mail,
            telefone e WhatsApp. Nos números brasileiros, o +55
            é aplicado automaticamente. Personalize a aparência
            ou transforme o código em uma peça visual com texto,
            marca e logo.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Crie seu QR Code</CardTitle>

            <CardDescription>
              Escolha o conteúdo, confira a prévia, personalize a
              composição visual e baixe a arte completa em PNG ou SVG.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-5"><ToolPrivacyNotice message="O QR Code é gerado no navegador. Se você escolher Salvar na conta, o conteúdo e as configurações, inclusive eventual senha Wi-Fi, serão enviados à sua conta Kivai. Logos grandes precisam ser reenviados ao abrir o projeto." /></div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tipo de QR Code
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TIPOS.map((item) => {
                  const Icone = item.icone;
                  const selecionado = tipo === item.valor;

                  return (
                    <button
                      key={item.valor}
                      type="button"
                      onClick={() => trocarTipo(item.valor)}
                      className={[
                        "border p-4 text-left transition-colors",
                        selecionado
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-muted/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            "flex size-10 shrink-0 items-center justify-center border",
                            selecionado
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-muted/20 text-muted-foreground",
                          ].join(" ")}
                        >
                          <Icone
                            className="size-4"
                            aria-hidden="true"
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {item.titulo}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {item.descricao}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Conteúdo
                  </p>

                  <QrContentFields {...qr} />
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Personalização
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="qr-cor"
                        className="text-sm font-medium"
                      >
                        Cor do QR Code
                      </label>

                      <div className="mt-2 flex h-11 border border-border bg-background">
                        <input
                          id="qr-cor"
                          type="color"
                          value={corQr}
                          onChange={(event) =>
                            setCorQr(event.target.value)
                          }
                          className="h-full w-14 cursor-pointer border-0 bg-transparent p-1"
                        />

                        <input
                          type="text"
                          value={corQr}
                          onChange={(event) =>
                            setCorQr(event.target.value)
                          }
                          className="min-w-0 flex-1 bg-transparent px-3 text-sm uppercase outline-none"
                          aria-label="Código hexadecimal da cor do QR Code"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="qr-fundo"
                        className="text-sm font-medium"
                      >
                        Cor de fundo
                      </label>

                      <div className="mt-2 flex h-11 border border-border bg-background">
                        <input
                          id="qr-fundo"
                          type="color"
                          value={corFundo}
                          onChange={(event) =>
                            setCorFundo(event.target.value)
                          }
                          className="h-full w-14 cursor-pointer border-0 bg-transparent p-1"
                        />

                        <input
                          type="text"
                          value={corFundo}
                          onChange={(event) =>
                            setCorFundo(event.target.value)
                          }
                          className="min-w-0 flex-1 bg-transparent px-3 text-sm uppercase outline-none"
                          aria-label="Código hexadecimal da cor de fundo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="qr-tamanho"
                        className="text-sm font-medium"
                      >
                        Tamanho: {tamanho} px
                      </label>

                      <input
                        id="qr-tamanho"
                        type="range"
                        min="200"
                        max="1000"
                        step="20"
                        value={tamanho}
                        onChange={(event) =>
                          setTamanho(Number(event.target.value))
                        }
                        className="mt-3 w-full accent-primary"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="qr-margem"
                        className="text-sm font-medium"
                      >
                        Margem: {margem}
                      </label>

                      <input
                        id="qr-margem"
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={margem}
                        onChange={(event) =>
                          setMargem(Number(event.target.value))
                        }
                        className="mt-3 w-full accent-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="qr-chamada" className="text-sm font-medium">
                        Texto exibido na arte
                      </label>
                      <input
                        id="qr-chamada"
                        type="text"
                        maxLength={28}
                        value={chamada}
                        onChange={(event) => setChamada(event.target.value)}
                        placeholder="Ex.: Aponte a câmera"
                        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>

                    <div>
                      <label htmlFor="qr-marca" className="text-sm font-medium">
                        Nome da marca
                      </label>
                      <input
                        id="qr-marca"
                        type="text"
                        maxLength={24}
                        value={nomeMarca}
                        onChange={(event) => setNomeMarca(event.target.value)}
                        placeholder="Ex.: Minha Loja"
                        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="qr-logo" className="text-sm font-medium">
                      Logo opcional
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <input
                        id="qr-logo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(event) => carregarLogo(event.target.files?.[0])}
                        className="min-w-0 flex-1 border border-border bg-background p-2 text-xs file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
                      />
                      {logoDataUrl && (
                        <Button type="button" variant="outline" onClick={() => setLogoDataUrl("")}>
                          Remover logo
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      A logo aparece no modelo Cartão de marca, sem cobrir a área de leitura do QR Code.
                    </p>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Correção de erro
                  </p>

                  <div className="space-y-3">
                    {NIVEIS_CORRECAO.map((item) => {
                      const selecionado =
                        nivelCorrecao === item.valor;

                      return (
                        <button
                          key={item.valor}
                          type="button"
                          onClick={() =>
                            setNivelCorrecao(item.valor)
                          }
                          className={[
                            "w-full border p-4 text-left transition-colors",
                            selecionado
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={[
                                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                                selecionado
                                  ? "border-primary"
                                  : "border-muted-foreground/40",
                              ].join(" ")}
                            >
                              {selecionado && (
                                <span className="size-2 rounded-full bg-primary" />
                              )}
                            </span>

                            <span>
                              <span className="block text-sm font-medium">
                                {item.titulo}
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                {item.descricao}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pré-visualização
                </p>

                <div className="flex min-h-[28rem] flex-col items-center justify-center border border-border bg-muted/20 p-5">
                  {gerando ? (
                    <ToolProcessingStatus status="processing" message="Gerando QR Code..." />
                  ) : qrDataUrl ? (
                    <>
                      <div className="flex w-full max-w-sm items-center justify-center border border-border bg-background p-5">
                        <img
                          src={arteDataUrl}
                          alt="Pré-visualização da arte com QR Code"
                          className="h-auto max-h-80 w-full object-contain"
                        />
                      </div>

                      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                        Teste o QR Code com a câmera do celular
                        antes de publicar ou imprimir.
                      </p>
                    </>
                  ) : (
                    <div className="flex max-w-xs flex-col items-center text-center">
                      <div className="flex size-14 items-center justify-center border border-border bg-background">
                        <QrCode
                          className="size-5"
                          aria-hidden="true"
                        />
                      </div>

                      <h2 className="mt-5 font-heading text-lg font-medium">
                        Seu QR Code aparecerá aqui
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Preencha os dados do conteúdo para gerar a
                        pré-visualização automaticamente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={baixarPng}
                    disabled={!arteDataUrl || gerando}
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    Baixar PNG
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={baixarSvg}
                    disabled={!arteSvg || gerando}
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    Baixar SVG
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="mt-3 w-full"
                  onClick={copiarConteudo}
                  disabled={!conteudoQr}
                >
                  {copiado ? (
                    <>
                      <Check
                        className="size-4"
                        aria-hidden="true"
                      />
                      Conteúdo copiado
                    </>
                  ) : (
                    <>
                      <Copy
                        className="size-4"
                        aria-hidden="true"
                      />
                      Copiar conteúdo
                    </>
                  )}
                </Button>

                {qrDataUrl && (
                  <div className="mt-5 border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Composições criativas
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Escolha uma composição. O texto, a marca, a logo e as cores podem ser personalizados.
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {MODELOS_QR_CODE.map((modelo) => {
                        const selecionado = modeloVisual === modelo.id;

                        return (
                          <button
                            key={modelo.titulo}
                            type="button"
                            onClick={() => aplicarModelo(modelo)}
                            aria-pressed={selecionado}
                            className={[
                              "flex min-h-20 items-start gap-3 border p-3 text-left transition-colors",
                              selecionado
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:bg-muted/40",
                            ].join(" ")}
                          >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-border bg-muted/30 text-[10px] font-bold text-primary" aria-hidden="true">
                              {modelo.id === "padrao" ? "QR" : modelo.id === "topo" ? "↑" : modelo.id === "lateral" ? "→" : modelo.id === "marca" ? "M" : "●"}
                            </span>
                            <span>
                              <span className="block text-sm font-medium">{modelo.titulo}</span>
                              <span className="mt-1 block text-xs leading-4 text-muted-foreground">{modelo.descricao}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 border border-border bg-muted/20 p-4">
                  <p className="text-xs leading-5 text-muted-foreground">
                    O QR Code é gerado localmente no navegador.
                    Seus dados não precisam ser enviados para um
                    servidor para criar a imagem.
                  </p>
                </div>
              </div>
            </div>

            <ToolErrorMessage message={erro} className="mt-6" />
          </CardContent>
        </Card>

        <SavedProjects kind="qr_code" payload={project} onLoad={loadProject} />
        <div className="mx-auto mt-8 max-w-4xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}
