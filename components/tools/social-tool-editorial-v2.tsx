import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import {
  generalToolEditorialContent,
  type GeneralToolEditorialSlug,
} from "@/lib/general-tool-editorial-content";
import {
  socialAdvancedEditorialContent,
  type SocialAdvancedEditorialContent,
  type SocialAdvancedEditorialSlug,
} from "@/lib/social-tool-editorial-content";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

type SocialToolEditorialSlug =
  | "contador-de-caracteres-instagram"
  | "calculadora-de-engajamento"
  | SocialAdvancedEditorialSlug;

type GeneralEditorialContent = (typeof generalToolEditorialContent)[GeneralToolEditorialSlug];
type EditorialContent = GeneralEditorialContent | SocialAdvancedEditorialContent;

const instagramContent: GeneralEditorialContent = {
  categoryName: "Social Media",
  categoryHref: "/ferramentas/social-media",
  applicationCategory: "BusinessApplication",
  overview: [
    "O Contador de Caracteres para Instagram conta os caracteres do texto digitado ou colado, mostra a quantidade de palavras e identifica hashtags presentes no texto.",
    "Ele foi pensado para revisar legendas antes da publicação. A contagem acontece no navegador e não representa uma validação oficial do limite exibido pelo aplicativo do Instagram.",
  ],
  useCases: [
    { title: "Revisar legendas", description: "Confira rapidamente o tamanho do texto antes de copiar a legenda para o Instagram." },
    { title: "Acompanhar palavras", description: "Veja a quantidade de palavras enquanto edita uma legenda." },
    { title: "Conferir hashtags", description: "Identifique quantas hashtags o texto contém usando o padrão reconhecido pela ferramenta." },
  ],
  steps: [
    "Digite ou cole a legenda no campo de texto.",
    "Confira a quantidade de caracteres, palavras e hashtags.",
    "Edite o texto até chegar ao tamanho desejado.",
    "Use o botão de copiar para levar o texto ao Instagram ou a outro aplicativo.",
  ],
  specifications: [
    { label: "Caracteres", value: "A contagem considera o tamanho da string digitada no navegador." },
    { label: "Palavras", value: "As palavras são separadas por espaços em branco após a remoção dos espaços nas extremidades." },
    { label: "Hashtags", value: "A ferramenta identifica hashtags formadas por # seguido de letras, números ou sublinhado." },
    { label: "Processamento", value: "O texto é processado localmente no navegador." },
    { label: "Ações", value: "É possível copiar o texto e limpar o campo para iniciar uma nova contagem." },
  ],
  privacy: "O texto digitado é processado localmente no navegador. A ferramenta não envia a legenda para servidores nem exige conexão com uma conta do Instagram.",
  limitations: [
    "A contagem é uma referência para revisão e não deve ser tratada como confirmação de um limite oficial da plataforma.",
    "Caracteres, palavras e hashtags são contados segundo a lógica desta ferramenta e podem não corresponder a contadores de terceiros com metodologias diferentes.",
    "A ferramenta não publica, agenda ou valida a legenda dentro do Instagram.",
  ],
  faqs: [
    { question: "O que o Contador de Caracteres para Instagram conta?", answer: "Ele mostra caracteres, palavras e hashtags presentes no texto digitado." },
    { question: "Preciso conectar minha conta do Instagram?", answer: "Não. O contador funciona no navegador sem login ou acesso à conta." },
    { question: "O texto é enviado para o Kivai?", answer: "Não. A contagem é feita localmente no navegador." },
    { question: "A ferramenta confirma o limite de caracteres do Instagram?", answer: "Não. Ela conta o texto informado, mas não valida um limite oficial diretamente no Instagram." },
    { question: "Como as hashtags são identificadas?", answer: "A ferramenta procura ocorrências de # seguidas por letras, números ou sublinhado." },
    { question: "Posso copiar minha legenda?", answer: "Sim. Use o botão de copiar para enviar o texto para a área de transferência." },
  ],
  related: [
    { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo" },
    { href: "/ferramentas/preview-de-post-redes-sociais", label: "Preview de Post" },
    { href: "/ferramentas/contador-de-palavras", label: "Contador de Palavras" },
  ],
};

const engagementContent: GeneralEditorialContent = {
  categoryName: "Social Media",
  categoryHref: "/ferramentas/social-media",
  applicationCategory: "BusinessApplication",
  overview: [
    "A taxa de engajamento expressa a relação percentual entre as interações registradas e uma base de comparação, como seguidores, alcance ou impressões. Curtidas, comentários, compartilhamentos, salvamentos e cliques podem compor o total quando fazem parte da metodologia adotada.",
    "O indicador ajuda a comparar conteúdos e períodos, mas não representa sozinho vendas, alcance futuro ou qualidade universal. O método, a plataforma, o formato e o tamanho da audiência precisam ser considerados na interpretação.",
  ],
  useCases: [
    {
      title: "Comparar publicações",
      description: "Use o mesmo método de cálculo para comparar conteúdos, formatos ou períodos dentro de uma mesma rede social.",
    },
    {
      title: "Analisar alcance",
      description: "Relacione as interações às pessoas ou contas alcançadas quando esse dado estiver disponível.",
    },
    {
      title: "Acompanhar desempenho",
      description: "Calcule taxas individuais, média das publicações e taxa consolidada para observar mudanças ao longo do tempo.",
    },
  ],
  steps: [
    "Escolha a base da análise: seguidores, alcance ou impressões.",
    "Informe as interações que farão parte da metodologia.",
    "Preencha o valor da base escolhida.",
    "Confira o total de interações e a taxa calculada.",
    "Mantenha o mesmo critério ao comparar conteúdos ou períodos.",
  ],
  specifications: [
    {
      label: "Fórmula",
      value: "Taxa de engajamento = total de interações ÷ base analisada × 100.",
    },
    {
      label: "Bases disponíveis",
      value: "Seguidores, alcance ou impressões, conforme os dados disponíveis e o objetivo da análise.",
    },
    {
      label: "Interações",
      value: "Curtidas, comentários, compartilhamentos, salvamentos, cliques e outras ações podem ser incluídos de acordo com a metodologia escolhida.",
    },
    {
      label: "Resultados",
      value: "Taxa individual, média das taxas e taxa consolidada para comparações mais transparentes.",
    },
  ],
  privacy: "Os números informados são calculados localmente no navegador. A ferramenta não acessa contas de redes sociais e não precisa de login em plataformas externas para realizar o cálculo.",
  limitations: [
    "Não existe uma taxa de engajamento ideal que seja válida para todas as redes, segmentos e tamanhos de audiência.",
    "Métricas de plataformas diferentes podem ter definições e métodos de contagem distintos.",
    "Engajamento não equivale automaticamente a leads, vendas, receita ou retorno financeiro.",
  ],
  faqs: [
    {
      question: "O que é taxa de engajamento?",
      answer: "É a relação percentual entre as interações registradas e uma base escolhida, como seguidores, alcance ou impressões.",
    },
    {
      question: "Como calcular a taxa de engajamento?",
      answer: "Some as interações, divida pela base analisada e multiplique por 100. A ferramenta faz essa operação automaticamente.",
    },
    {
      question: "Devo calcular por seguidores ou alcance?",
      answer: "Seguidores relacionam as ações ao tamanho da audiência do perfil; alcance relaciona as ações às pessoas ou contas alcançadas. A escolha depende do objetivo e dos dados disponíveis.",
    },
    {
      question: "Qual é a diferença entre alcance e impressões?",
      answer: "Alcance costuma representar pessoas ou contas únicas expostas; impressões representam o total de exibições, inclusive repetições.",
    },
    {
      question: "Existe uma taxa de engajamento ideal?",
      answer: "Não existe uma taxa universal. Plataforma, formato, segmento, audiência, período e método influenciam o resultado.",
    },
    {
      question: "A ferramenta publica ou acessa minhas redes sociais?",
      answer: "Não. Todos os números são fornecidos pelo usuário e calculados localmente, sem conexão com contas externas.",
    },
  ],
  related: [
    { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo" },
    { href: "/ferramentas/calendario-editorial-redes-sociais", label: "Calendário Editorial" },
    { href: "/ferramentas/preview-de-post-redes-sociais", label: "Preview de Post" },
    { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de Caracteres" },
    { href: "/ferramentas/calculadora-de-roas", label: "Calculadora de ROAS" },
  ],
};

function isAdvancedSlug(slug: SocialToolEditorialSlug): slug is SocialAdvancedEditorialSlug {
  return slug in socialAdvancedEditorialContent;
}

function getContent(slug: SocialToolEditorialSlug): EditorialContent {
  if (slug === "calculadora-de-engajamento") return engagementContent;
  if (slug === "contador-de-caracteres-instagram") return instagramContent;
  if (isAdvancedSlug(slug)) return socialAdvancedEditorialContent[slug];
  return generalToolEditorialContent[slug];
}

export function SocialToolEditorialV2({ slug }: { slug: SocialToolEditorialSlug }) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const content = getContent(slug);
  const relatedTools = content.related.filter((item) => item.href !== `/ferramentas/${slug}`);
  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    applicationCategory: content.applicationCategory,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Social Media", href: "/ferramentas/social-media" },
      { name: tool.name, href: `/ferramentas/${slug}` },
    ],
    faqs: content.faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <ToolEditorialLayout
        slug={slug}
        overview={content.overview}
        useCases={content.useCases}
        steps={content.steps}
        specificationsTitle="Critérios, recursos e resultado"
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={relatedTools}
        afterFaq={<AdSlot placement="tool-bottom" />}
      />
    </>
  );
}
