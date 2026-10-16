import { AdSlot } from "@/components/ads/AdSlot";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { getToolMetadataAsync } from "@/lib/seo";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import AnalisadorDePostsClient from "./analisador-de-posts-client";

const slug = "analisador-de-posts";
const faqs = [
  { question: "O Kivai consegue analisar um post apenas pelo link?", answer: "Sim, quando o serviço disponibiliza dados suficientes. O YouTube pode permitir até análise audiovisual por IA. Instagram, TikTok, Facebook e LinkedIn têm restrições variáveis. Quando faltam dados, o Kivai solicita material complementar." },
  { question: "Sou obrigado a enviar o arquivo?", answer: "Não. Você pode selecionar Não quero enviar o arquivo e continuar com as informações disponíveis. Caso nada possa ser acessado pelo link, será necessário fornecer ao menos o conteúdo textual ou a mídia." },
  { question: "É possível analisar rascunhos?", answer: "Sim. Escolha Rascunho e envie uma imagem, vídeo ou texto. O link é opcional para uma publicação ainda não realizada." },
  { question: "A ferramenta assiste a todos os vídeos?", answer: "Não. Quando o acesso audiovisual pelo link não funciona, podem ser analisados apenas metadados ou quadros visuais extraídos de arquivo enviado. O relatório informa quais elementos foram examinados." },
  { question: "Preciso entrar na minha conta?", answer: "Sim. A análise por IA utiliza o sistema de créditos do Kivai e exige login e consentimento para o processamento externo." },
];
const description = "Analise publicações de redes sociais com IA, receba sugestões para legendas, ganchos, CTAs e edições, usando link e arquivo opcional.";

export async function generateMetadata() { return getToolMetadataAsync(slug); }

export default function AnalisadorDePostsPage() {
  const schema = buildToolPageSchema({
    name: "Analisador de Posts", slug, description,
    applicationCategory: "BusinessApplication",
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Social Media", href: "/ferramentas/social-media" },
      { name: "Analisador de Posts", href: "/ferramentas/analisador-de-posts" },
    ], faqs,
  });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <ToolPageShell
      title="Analisador de Posts"
      description="Descubra o que melhorar em uma publicação e receba recomendações práticas com inteligência artificial."
      categoryName="Social Media"
      categoryHref="/ferramentas/social-media"
      processingMode="server"
      privacyMessage="As informações disponíveis da URL e as imagens otimizadas ou quadros extraídos localmente são enviados ao servidor Kivai e ao serviço externo de IA somente após consentimento. O arquivo original não é enviado nesta versão. Não inclua dados sensíveis."
    ><AnalisadorDePostsClient /></ToolPageShell>
    <ToolEditorialLayout
      slug={slug}
      overview={[
        "O Analisador de Posts revisa publicações para redes sociais e propõe melhorias na clareza da mensagem, na abertura, na legenda, na chamada para ação e na apresentação visual, de acordo com os elementos realmente examinados.",
        "O endereço público ajuda a identificar a rede social e recuperar dados disponíveis. O usuário pode complementar a análise com imagens, carrosséis ou vídeos. Quando o conteúdo não estiver acessível, o Kivai informa a limitação e solicita informações complementares.",
        "A ferramenta apresenta pontos fortes, problemas identificados, correções, alternativas de ganchos e próximos passos. As recomendações são hipóteses editoriais, não garantias de alcance, vendas ou viralização.",
      ]}
      useCases={[
        { title: "Revisar um post já publicado", description: "Compreenda o que pode ser melhorado e transforme o aprendizado em novas versões de conteúdo." },
        { title: "Avaliar um rascunho", description: "Revise uma publicação antes de enviá-la para a rede social, com apoio de sugestões de gancho, legenda e CTA." },
        { title: "Planejar melhorias para campanhas", description: "Compare recomendações com o objetivo desejado, como alcance, engajamento, autoridade ou captação de leads." },
      ]}
      steps={[
        "Escolha publicação já realizada ou rascunho.",
        "Cole o link público da publicação, quando disponível.",
        "Se desejar, envie imagens, carrossel ou vídeo, ou assinale que não quer enviar arquivo.",
        "Escolha o objetivo e informe opcionalmente seu público-alvo.",
        "Autorize o processamento com IA e clique em Analisar Publicação.",
        "Revise o relatório e copie as melhorias desejadas.",
      ]}
      specificationsTitle="Recursos e condições de análise"
      specifications={[
        { label: "Redes", value: "Reconhece links de YouTube, Instagram, TikTok, Facebook, LinkedIn, X, Threads e Pinterest. A leitura automática varia por plataforma." },
        { label: "Arquivos", value: "Até 8 imagens ou 1 vídeo por análise, limite de 40 MB por arquivo na leitura local." },
        { label: "Vídeos enviados", value: "Nesta versão são extraídos três quadros no navegador. O áudio e o movimento contínuo não são enviados, portanto não são examinados." },
        { label: "YouTube", value: "Tenta análise audiovisual de vídeos públicos de até 3 minutos quando a duração puder ser confirmada, ou Shorts. Nos demais casos, utiliza metadados acessíveis." },
        { label: "IA e créditos", value: "Login necessário. Utiliza 1 crédito para análise por link e 2 créditos quando houver imagens ou quadros de vídeo enviados." },
        { label: "Relatório", value: "Pontos fortes, problemas, ajustes, legenda, ganchos, CTA, sugestões de edição e limitações encontradas." },
      ]}
      privacy="O Kivai verifica metadados disponíveis em serviços externos. Com consentimento, envia textos e imagens otimizadas ou quadros extraídos de vídeo para um serviço de IA. O arquivo original continua no seu dispositivo durante esse fluxo. A ferramenta exige autenticação e aplica limites por usuário. Evite enviar conteúdo pessoal ou confidencial."
      limitations={[
        "Nem toda publicação pública expõe sua descrição, imagens ou métricas a aplicativos externos.",
        "Uma URL não autoriza acesso a dados privados de uma conta nem garante análise audiovisual.",
        "Algumas plataformas exigem que o usuário envie arquivo ou forneça a legenda quando a leitura falhar.",
        "A análise de quadros de vídeo não substitui a avaliação do áudio, do ritmo ou da edição em movimento.",
        "A IA pode cometer erros. Valide sugestões antes de publicar e respeite as regras de cada plataforma.",
      ]}
      faqs={faqs}
      relatedTools={[
        { href: "/ferramentas/baixar-video-instagram", label: "Baixar Vídeo e Foto do Instagram" },
        { href: "/ferramentas/baixar-video-tiktok", label: "Baixar Vídeo do TikTok" },
        { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo Social Media" },
        { href: "/ferramentas/preview-de-post-redes-sociais", label: "Preview de Post para Redes Sociais" },
      ]}
      afterFaq={<AdSlot placement="tool-bottom" />}
    />
  </>;
}
