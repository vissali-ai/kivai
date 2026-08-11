import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getToolMetadata } from "@/lib/seo";
import Mp4ParaHevcClient from "./mp4-para-hevc-client";

export const metadata = getToolMetadata("mp4-para-hevc");
const faq = [
  ["O que é HEVC?", "HEVC, também chamado H.265, é um codec de vídeo eficiente que pode entregar boa qualidade usando menos dados."],
  ["MP4 e HEVC são a mesma coisa?", "Não. MP4 é um container; HEVC é o codec que comprime o vídeo dentro dele."],
  ["Qual arquivo a ferramenta gera?", "Ela gera um arquivo MP4 com vídeo codificado em HEVC/H.265 e áudio AAC quando o original possui áudio."],
  ["Como converter MP4 para HEVC?", "Selecione o MP4, escolha a qualidade, clique em Converter para HEVC e baixe o resultado."],
  ["A resolução será mantida?", "Sim. A largura e a altura do vídeo original são preservadas."],
  ["A qualidade muda?", "Toda recodificação pode produzir pequena diferença visual. O perfil Alta qualidade reduz a compressão."],
  ["O arquivo ficará sempre menor?", "HEVC costuma ser mais eficiente, mas o tamanho final depende do conteúdo, duração e codec do MP4 original."],
  ["O áudio será preservado?", "Sim. Quando houver áudio, ele é convertido para AAC a 192 kb/s."],
  ["HEVC funciona em qualquer dispositivo?", "Não. Dispositivos e programas antigos podem exigir suporte adicional ao codec H.265."],
  ["Posso converter vídeos do celular?", "Sim, desde que estejam em MP4 e tenham até 200 MB."],
  ["Quanto tempo demora?", "O tempo depende da duração, resolução, qualidade escolhida e carga do serviço. HEVC exige mais processamento."],
  ["Existe limite de tamanho?", "Sim. É aceito um vídeo MP4 por vez, com até 200 MB."],
  ["O arquivo original é alterado?", "Não. A ferramenta cria um novo arquivo e mantém o original intacto."],
  ["O processamento é seguro?", "O arquivo é transmitido por HTTPS e os dados temporários são removidos após o processamento."],
  ["Funciona no celular e computador?", "Sim. A interface é responsiva e funciona em navegadores modernos no computador, celular e tablet."],
] as const;
const schema = { "@context": "https://schema.org", "@graph": [
  { "@type": "SoftwareApplication", name: "MP4 para HEVC", applicationCategory: "MultimediaApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/mp4-para-hevc", description: "Converta vídeos MP4 para HEVC/H.265 online.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "Vídeos", item: "https://www.kivai.com.br/ferramentas/videos" }, { "@type": "ListItem", position: 3, name: "MP4 para HEVC", item: "https://www.kivai.com.br/ferramentas/mp4-para-hevc" }] },
  { "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
] };

export default function Mp4ParaHevcPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><Mp4ParaHevcClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <Info title="O que é MP4 para HEVC?"><p>A ferramenta recodifica o vídeo de um arquivo MP4 usando HEVC, também conhecido como H.265. O resultado continua em um container MP4, facilitando o armazenamento e mantendo áudio e vídeo organizados em um único arquivo.</p></Info>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Quando utilizar"><ul className="list-disc space-y-2 pl-5"><li>Reduzir o espaço ocupado por uma biblioteca de vídeos.</li><li>Preparar conteúdo para aparelhos compatíveis com H.265.</li><li>Arquivar vídeos longos com compressão mais eficiente.</li><li>Enviar arquivos preservando a resolução original.</li></ul></Info><Info title="Principais vantagens"><ul className="space-y-2">{["Codec HEVC/H.265 moderno", "Resolução original preservada", "Três perfis de qualidade", "Áudio convertido para AAC", "Arquivo MP4 otimizado para streaming"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{item}</li>)}</ul></Info></div>
    <Info title="Como converter MP4 para HEVC"><ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{["Selecione o MP4.", "Confira o arquivo.", "Escolha a qualidade.", "Converta para HEVC.", "Visualize e baixe."].map((step, index) => <li key={step} className="rounded-lg border border-border p-4 text-sm"><span className="mb-3 flex size-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span>{step}</li>)}</ol></Info>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Qualidade e tamanho"><p>O perfil Automático equilibra qualidade e tamanho. Alta qualidade aplica menos compressão e pode gerar um arquivo maior. Arquivo menor usa compressão mais forte. O resultado varia conforme movimento, detalhes e codec do original.</p></Info><Info title="Compatibilidade"><p>HEVC é eficiente, porém nem todo navegador, editor ou aparelho oferece suporte nativo. Para máxima compatibilidade, use a ferramenta inversa HEVC para MP4, que gera vídeo H.264.</p></Info></div>
    <Info title="Privacidade e limites"><p>É aceito um MP4 de até 200 MB por conversão. O arquivo é enviado por HTTPS, processado temporariamente no serviço e removido depois que o resultado é entregue.</p></Info>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/hevc-para-mp4">HEVC para MP4</Related><Related href="/ferramentas/video-para-audio">Vídeo para Áudio</Related><Related href="/ferramentas/redimensionar-video">Redimensionar Vídeo</Related><Related href="/ferramentas/ajustar-velocidade-video">Ajustar Velocidade</Related><Related href="/ferramentas/alterar-volume-video">Alterar Volume</Related></div></nav>
  </div></section></>;
}
function Info({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">{title}</h2><div className="mt-4 leading-7 text-muted-foreground">{children}</div></article>; }
function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
