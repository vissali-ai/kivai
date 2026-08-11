import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import HevcParaMp4Client from "./hevc-para-mp4-client";

export const metadata = getToolMetadata("hevc-para-mp4");

const faq = [
  ["O que é HEVC?", "HEVC significa High Efficiency Video Coding. É um codec de compressão criado para entregar boa qualidade com arquivos menores."],
  ["HEVC e H.265 são a mesma coisa?", "Sim. H.265 é a identificação técnica do padrão também conhecido como HEVC."],
  ["O que é MP4?", "MP4 é um container que pode reunir vídeo, áudio e outros dados. Nesta ferramenta, ele recebe vídeo H.264 e áudio AAC quando o original contém áudio."],
  ["Como converter HEVC para MP4?", "Selecione o vídeo, escolha a qualidade, clique em Converter para MP4 e baixe o resultado quando o processamento terminar."],
  ["A qualidade do vídeo será mantida?", "A resolução é mantida, mas existe recodificação. Pode ocorrer pequena diferença visual conforme o perfil de qualidade selecionado."],
  ["O áudio será preservado?", "Sim, quando o arquivo possui uma faixa de áudio compatível. Ela é convertida para AAC a 192 kb/s."],
  ["A resolução será mantida?", "Sim. A conversão preserva a largura e a altura do vídeo original."],
  ["Posso converter vídeos gravados no celular?", "Sim, desde que o arquivo utilize HEVC/H.265 e permaneça dentro do limite de 200 MB."],
  ["Por que meu vídeo HEVC não abre?", "O dispositivo, navegador ou aplicativo pode não possuir um decodificador HEVC disponível ou licenciado."],
  ["MP4 funciona em mais dispositivos?", "Um MP4 com H.264 e AAC costuma ter suporte mais amplo. Ainda assim, a compatibilidade depende do dispositivo e do aplicativo usados."],
  ["Quanto tempo demora a conversão?", "Depende da duração, resolução, tamanho, qualidade escolhida e capacidade do servidor. Vídeos maiores levam mais tempo."],
  ["Existe limite de tamanho?", "Sim. O limite atual é de um vídeo por vez e até 200 MB."],
  ["Posso usar no navegador?", "Sim. A interface funciona em navegadores modernos e envia o arquivo por conexão segura para o serviço de conversão."],
  ["A ferramenta funciona no computador?", "Sim. Ela foi criada para uso em computadores e também possui interface adaptada a celulares e tablets."],
  ["O arquivo original é alterado?", "Não. Um novo MP4 é criado e o arquivo original permanece inalterado no dispositivo."],
] as const;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "SoftwareApplication", name: "HEVC para MP4", applicationCategory: "MultimediaApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/hevc-para-mp4", description: "Converta vídeos HEVC/H.265 para MP4 com vídeo H.264 e áudio AAC.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "Vídeos", item: "https://www.kivai.com.br/ferramentas/videos" }, { "@type": "ListItem", position: 3, name: "HEVC para MP4", item: "https://www.kivai.com.br/ferramentas/hevc-para-mp4" }] },
    { "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
  ],
};

export default function HevcParaMp4Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><HevcParaMp4Client /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é HEVC?</h2><div className="mt-4 space-y-4 leading-7 text-muted-foreground"><p>HEVC significa High Efficiency Video Coding e também é conhecido como H.265. Ele reduz o tamanho necessário para armazenar vídeo mantendo boa qualidade, por isso aparece com frequência em gravações de celulares, câmeras e conteúdos em alta resolução.</p><p>Apesar da eficiência, o suporte ao codec pode variar. Alguns computadores, navegadores, editores e plataformas não conseguem decodificá-lo sem componentes adicionais.</p></div></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Por que converter HEVC para MP4?"><p>A conversão gera um MP4 com vídeo H.264 e áudio AAC, combinação amplamente reconhecida por navegadores, editores, sistemas de upload e dispositivos. Isso facilita reprodução, compartilhamento, edição, publicação e arquivamento.</p></Info><Info title="HEVC e MP4 são a mesma coisa?"><p>Não. HEVC/H.265 é o codec que comprime as imagens do vídeo. MP4 é o container que organiza vídeo, áudio e metadados. Apenas trocar a extensão ou o container não garante compatibilidade; por isso esta ferramenta recodifica o vídeo para H.264.</p></Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter HEVC para MP4</h2><ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{["Selecione o vídeo HEVC.", "Confira o arquivo escolhido.", "Escolha o perfil de qualidade.", "Converta para MP4.", "Visualize e baixe o resultado."].map((step, index) => <li key={step} className="rounded-lg border border-border p-4 text-sm leading-6 text-muted-foreground"><span className="mb-3 flex size-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span>{step}</li>)}</ol></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Quando usar"><ul className="list-disc space-y-2 pl-5"><li>Uma gravação do celular não abre no computador.</li><li>O editor não reconhece o codec HEVC.</li><li>Uma plataforma rejeita o arquivo original.</li><li>Você precisa enviar o vídeo a um cliente.</li><li>O material será arquivado em formato mais compatível.</li></ul></Info><Info title="Qualidade e compatibilidade"><p>A resolução original é preservada. Como o vídeo é recodificado, pode existir pequena diferença visual. O perfil Alta qualidade reduz essa diferença, enquanto Arquivo menor aplica compressão mais forte. O resultado usa pixel format yuv420p e otimização fast start para reprodução na web.</p></Info></div>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Processamento e privacidade"><p>O vídeo é transmitido por HTTPS ao serviço de conversão. Arquivos temporários são removidos após o envio do resultado. O download é disponibilizado no navegador e o arquivo original não é modificado.</p></Info><Info title="Limites e cuidados"><p>É aceito um arquivo de até 200 MB por conversão. O codec real é analisado pelo FFmpeg; arquivos apenas renomeados, danificados ou codificados em formatos diferentes são recusados com uma mensagem amigável.</p></Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/video-para-audio">Vídeo para Áudio</Related><Related href="/ferramentas/redimensionar-video">Redimensionar Vídeo</Related><Related href="/ferramentas/ajustar-velocidade-video">Ajustar Velocidade</Related><Related href="/ferramentas/alterar-volume-video">Alterar Volume</Related><Related href="/ferramentas/dividir-video">Dividir Vídeo</Related><Related href="/ferramentas/capturar-frame-video">Capturar Frame</Related></div></nav>
  </div></section></>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><CheckCircle2 className="size-5 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><div className="mt-3 leading-7 text-muted-foreground">{children}</div></article>; }
function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
