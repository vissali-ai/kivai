import type { Metadata } from "next";
import Link from "next/link";
import RelatorioSocialMediaClient from "./relatorio-client";

const title = "Gerador de Relatório Social Media Grátis | Kivai";
const description = "Crie relatórios de redes sociais com métricas, engajamento, crescimento, comparações e gráficos para acompanhar e apresentar resultados.";
const canonical = "https://www.kivai.com.br/ferramentas/gerador-de-relatorio-social-media";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: canonical, siteName: "Kivai", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image", title, description },
  keywords: ["gerador de relatório social media", "relatório social media", "relatório de redes sociais", "relatório Instagram", "modelo de relatório social media", "relatório para cliente social media"],
};

const faq = [
  ["O que é um relatório de social media?", "É um documento que organiza métricas de uma rede social em determinado período, contextualizando audiência, conteúdo, alcance, interações e outros indicadores informados."],
  ["Quais métricas devo colocar no relatório?", "Use as métricas relacionadas aos objetivos do trabalho e disponíveis na plataforma, como seguidores, alcance, impressões, interações, conteúdo publicado, cliques e conversões."],
  ["Preciso conectar meu Instagram?", "Não. Os dados são preenchidos manualmente e a ferramenta não solicita login, token ou acesso à conta."],
  ["O Kivai acessa minha conta?", "Não. Esta versão não se conecta às APIs de Instagram, Facebook, TikTok, LinkedIn ou outras redes."],
  ["Posso criar relatório para clientes?", "Sim. É possível informar cliente, perfil, rede, responsável, período e observações profissionais antes de imprimir ou exportar."],
  ["Posso criar relatório de Instagram e TikTok?", "Sim. A estrutura se adapta às métricas informadas, inclusive quando uma plataforma não disponibiliza determinada métrica."],
  ["Posso comparar dois períodos?", "Sim. Ative a comparação e informe seguidores, alcance, impressões, interações, cliques ou publicações do período anterior."],
  ["Como é calculado o crescimento de seguidores?", "A diferença entre seguidores finais e iniciais é dividida pelos seguidores iniciais e multiplicada por 100. Se a base for zero, o percentual não é calculado."],
  ["Como é calculada a taxa de engajamento?", "A soma das interações é dividida por seguidores, alcance ou impressões, conforme o método escolhido, e multiplicada por 100."],
  ["Qual a diferença entre alcance e impressões?", "Alcance representa contas ou pessoas alcançadas; impressões representam exibições e podem incluir mais de uma exibição para a mesma pessoa."],
  ["Posso adicionar resultados de mídia paga?", "Sim. Investimento, impressões, cliques, leads, conversões e receita são opcionais e geram indicadores complementares quando há dados suficientes."],
  ["Posso baixar o relatório em PDF?", "Sim. Use o botão de download no relatório final. Como alternativa, a impressão do navegador permite escolher Salvar como PDF."],
  ["Posso imprimir o relatório?", "Sim. A versão de impressão mostra somente o relatório e aplica configuração A4, ocultando formulário, navegação, anúncios e controles."],
  ["Meus dados ficam salvos?", "O relatório em andamento e até dez relatórios salvos ficam no armazenamento local deste navegador. Eles não são enviados ao Kivai nesta versão."],
  ["A ferramenta substitui os analytics das plataformas?", "Não. Ela organiza e calcula os dados fornecidos pelo usuário, sem coleta automática ou auditoria oficial das redes."],
] as const;

const jsonLd = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Gerador de Relatório Social Media", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: canonical, description, offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" }, featureList: ["Relatório de métricas", "Comparação entre períodos", "Gráficos", "Persistência local", "Impressão A4", "Exportação em PDF"] },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "Social Media", item: "https://www.kivai.com.br/ferramentas/social-media" }, { "@type": "ListItem", position: 3, name: "Gerador de Relatório Social Media", item: canonical }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
];

export default function GeradorRelatorioSocialMediaPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <RelatorioSocialMediaClient />
    <section className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-20 sm:px-6 lg:px-8">
      <article className="prose-kivai"><h2>O que é um relatório de social media?</h2><p>Um relatório de social media organiza os números de uma rede social em um período definido. Ele ajuda a registrar o que foi publicado, como a audiência mudou, quantas pessoas foram alcançadas e quais interações foram informadas. Um bom documento identifica a origem dos dados, explica os cálculos e separa observações profissionais de conclusões matemáticas.</p><p>Este gerador não coleta dados das plataformas. Você transfere as métricas dos analytics da rede para um relatório visual, revisa a prévia e escolhe imprimir ou exportar. Isso permite trabalhar com Instagram, TikTok, Facebook, YouTube, LinkedIn e outras redes sem conceder acesso à conta.</p></article>
      <article className="prose-kivai"><h2>Quais métricas colocar em um relatório de redes sociais?</h2><p>A escolha depende do objetivo. Seguidores ajudam a acompanhar o tamanho da audiência; alcance e impressões descrevem distribuição e exibição; interações registram ações no conteúdo; cliques, leads e conversões aproximam a análise dos resultados de negócio. Métricas indisponíveis podem ficar em branco, sem serem exibidas como zero.</p><p>Alcance, curtidas, comentários e seguidores são indicadores de desempenho, mas não representam automaticamente vendas, lucro ou retorno financeiro. Quando o objetivo envolve negócio, analise também conversões, CPA, receita, <Link href="/ferramentas/calculadora-de-roas">ROAS</Link> e <Link href="/ferramentas/calculadora-de-roi">ROI</Link>.</p></article>
      <article className="prose-kivai"><h2>Como usar o Gerador de Relatório Social Media</h2><ol><li>Escolha a rede social e identifique cliente, perfil e responsável.</li><li>Informe o período analisado.</li><li>Adicione os números da audiência e do conteúdo publicado.</li><li>Preencha alcance, impressões e interações disponíveis.</li><li>Escolha a base da taxa de engajamento.</li><li>Inclua tráfego, conversões ou mídia paga somente se possuir esses dados.</li><li>Ative a comparação com o período anterior, se necessário.</li><li>Adicione os conteúdos de destaque.</li><li>Escreva suas observações e próximos passos.</li><li>Revise métricas, gráficos e resumo.</li><li>Salve no navegador, copie o resumo, imprima ou exporte em PDF.</li></ol></article>
      <article className="prose-kivai"><h2>Exemplo de relatório de Instagram</h2><p>Considere julho de 2026 com 10.000 seguidores iniciais e 10.500 finais. A variação é de 500 seguidores e o crescimento calculado é 5%. Se o período registrar 5.000 interações e alcance de 80.000 contas, a taxa por alcance será:</p><p><strong>5.000 ÷ 80.000 × 100 = 6,25%</strong></p><p>O percentual descreve a relação entre interações e alcance neste conjunto de dados. A ferramenta não o classifica automaticamente como bom ou ruim, pois plataforma, formato, audiência, período e objetivo alteram a interpretação.</p></article>
      <article className="prose-kivai"><h2>Como comparar dois períodos</h2><p>A comparação utiliza variação absoluta e percentual. Um alcance que passa de 72.000 para 86.000 aumenta 14.000, ou 19,44%. Se o valor anterior for zero, a variação absoluta continua disponível, mas o percentual não é calculado, evitando resultados como Infinity ou NaN.</p><p>Comparações devem usar definições e fontes consistentes. Se o método, o período ou a composição das interações mudar, documente essa alteração nas observações do relatório.</p></article>
      <article className="prose-kivai"><h2>Como apresentar resultados para clientes</h2><p>Comece pelo período, objetivo e fonte dos dados. Depois mostre poucos indicadores centrais, a comparação relevante e conteúdos de destaque. Use a análise livre para registrar contexto que os números não demonstram por si mesmos. Não atribua causas sem evidências: aumento de alcance não prova sozinho que uma ação específica foi responsável.</p><p>Para organizar a execução antes do relatório, use o <Link href="/ferramentas/planejador-de-conteudo-social-media">Planejador de Conteúdo</Link> e o <Link href="/ferramentas/calendario-editorial-redes-sociais">Calendário Editorial</Link>. Para revisar a apresentação antes de publicar, consulte o <Link href="/ferramentas/preview-de-post-redes-sociais">Preview de Post</Link>. Para estudar somente a fórmula da métrica, use a <Link href="/ferramentas/calculadora-de-engajamento">Calculadora de Engajamento</Link>.</p></article>
      <article><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-6 divide-y divide-border border-y border-border">{faq.map(([question, answer]) => <details key={question} className="group py-4"><summary className="cursor-pointer list-none font-medium">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
      <nav aria-label="Ferramentas relacionadas"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-5 flex flex-wrap gap-3">{[["Calculadora de Engajamento", "/ferramentas/calculadora-de-engajamento"], ["Planejador de Conteúdo", "/ferramentas/planejador-de-conteudo-social-media"], ["Calendário Editorial", "/ferramentas/calendario-editorial-redes-sociais"], ["Preview de Post", "/ferramentas/preview-de-post-redes-sociais"], ["Calculadora de ROAS", "/ferramentas/calculadora-de-roas"], ["Calculadora de ROI", "/ferramentas/calculadora-de-roi"]].map(([label, href]) => <Link key={href} href={href} className="border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{label}</Link>)}</div></nav>
    </section>
  </>;
}
