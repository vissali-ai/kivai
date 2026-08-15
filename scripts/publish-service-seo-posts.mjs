import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok) {
    throw new Error(`Supabase (${response.status}): ${await response.text()}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const categories = await request(
  "blog_categories?select=id,name,slug&slug=eq.marketing&limit=1",
);
const marketingCategory = categories[0];
if (!marketingCategory) throw new Error("Categoria Marketing não encontrada.");

const posts = [
  {
    title: "Social Media para empresas: como planejar conteúdo que gera oportunidades",
    subtitle:
      "Um guia para organizar temas, formatos e objetivos sem transformar as redes sociais em uma sequência de publicações desconectadas.",
    slug: "social-media-para-empresas-como-planejar-conteudo",
    excerpt:
      "Entenda como funciona o planejamento de Social Media para empresas e como criar uma presença profissional, consistente e ligada aos objetivos do negócio.",
    seoTitle: "Social Media para Empresas: Como Planejar Conteúdo | Kivai",
    metaDescription:
      "Veja como planejar Social Media para empresas, organizar um calendário editorial e criar conteúdos alinhados ao posicionamento e às vendas.",
    tags: ["Social Media", "Redes Sociais", "Marketing de Conteúdo", "Planejamento Editorial"],
    relatedToolSlugs: ["planejador-de-conteudo-social-media", "calendario-editorial-redes-sociais"],
    content: `
      <p>Manter uma presença ativa nas redes sociais não significa apenas publicar com frequência. Para uma empresa, cada conteúdo precisa cumprir uma função: apresentar um produto, esclarecer uma dúvida, fortalecer o posicionamento, criar relacionamento ou apoiar uma oportunidade comercial. É por isso que um trabalho de <a href="/servicos/social-media"><strong>Social Media para empresas</strong></a> começa pelo planejamento, e não pela arte.</p>
      <p>Sem uma direção editorial, é comum alternar períodos de muitas publicações com semanas de silêncio. Também surgem conteúdos repetitivos, mensagens inconsistentes e dificuldade para saber o que publicar. Um processo organizado ajuda a transformar objetivos do negócio em temas e formatos que façam sentido para o público.</p>
      <h2>O que é Social Media para empresas?</h2>
      <p>Social Media é o serviço de planejamento, criação, organização e publicação de conteúdo para redes sociais. O trabalho pode incluir calendário editorial, definição de temas, pautas, textos, legendas, artes, carrosséis, Stories, planejamento de Reels e acompanhamento das principais métricas.</p>
      <p>A diferença entre simplesmente postar e trabalhar com estratégia está na intenção. Uma publicação pode educar o público, demonstrar autoridade, explicar um serviço, responder a uma objeção ou direcionar para um contato. O calendário precisa equilibrar essas funções em vez de concentrar todas as mensagens em ofertas.</p>
      <h2>Como montar um planejamento de conteúdo para 30 dias</h2>
      <h3>1. Defina o objetivo do período</h3>
      <p>O primeiro passo é escolher o que a empresa precisa comunicar naquele momento. Pode ser o lançamento de um produto, a divulgação de um serviço, o fortalecimento da marca ou a geração de contatos. Um calendário pode atender mais de um objetivo, mas precisa ter prioridades claras.</p>
      <h3>2. Organize pilares de conteúdo</h3>
      <p>Os pilares são grupos de assuntos que ajudam a manter variedade e consistência. Uma empresa pode trabalhar, por exemplo, conteúdos educativos, institucionais, comerciais, demonstrações de produtos, bastidores fornecidos pela equipe e respostas às dúvidas dos clientes.</p>
      <h3>3. Escolha os formatos adequados</h3>
      <p>Feed, carrossel, Stories e Reels têm funções diferentes. Carrosséis ajudam a explicar temas em etapas; Stories favorecem atualizações e relacionamento; Reels podem ampliar a descoberta quando existe material em vídeo; posts de Feed ajudam a consolidar mensagens importantes.</p>
      <h3>4. Escreva pautas e chamadas para ação</h3>
      <p>Uma pauta deve indicar o assunto, o objetivo, o formato e a mensagem principal. A chamada para ação pode convidar a salvar, compartilhar, comentar, acessar uma página ou conversar com a empresa. Nem todo conteúdo precisa pedir uma compra, mas todo conteúdo deve ter uma intenção.</p>
      <h3>5. Programe e acompanhe</h3>
      <p>Depois da criação e aprovação, as publicações podem ser programadas. O acompanhamento de alcance, interações, salvamentos, cliques e contatos ajuda a identificar quais temas merecem continuidade no próximo ciclo.</p>
      <h2>Quais problemas um serviço de Social Media ajuda a resolver?</h2>
      <ul>
        <li>Falta de ideias e dificuldade para manter frequência;</li>
        <li>Comunicação visual e textual sem padrão;</li>
        <li>Conteúdos desconectados de produtos, serviços e posicionamento;</li>
        <li>Ausência de calendário e processos de aprovação;</li>
        <li>Publicações sem análise do que desperta interesse do público.</li>
      </ul>
      <h2>Social Media e tráfego pago são serviços diferentes</h2>
      <p>O Social Media organiza o conteúdo e a presença da marca. Já a <a href="/servicos/gestao-de-trafego">gestão de tráfego pago</a> utiliza investimento em mídia para distribuir anúncios e alcançar públicos específicos. As duas frentes podem trabalhar juntas, mas cada uma possui um escopo próprio.</p>
      <h2>Quando contratar Social Media?</h2>
      <p>A contratação faz sentido quando a empresa reconhece a importância das redes sociais, mas não consegue manter planejamento, consistência e qualidade internamente. Também é útil para negócios que precisam profissionalizar a comunicação antes de ampliar campanhas ou lançar novas ofertas.</p>
      <p>O Kivai oferece planejamento para 30 dias, criação e publicação de conteúdo, com um período de teste grátis para interessados. <a href="/servicos/social-media"><strong>Conheça o serviço de Social Media</strong></a> e veja como ele pode ser adaptado ao momento da sua empresa.</p>
    `,
  },
  {
    title: "Gestão de tráfego pago: como funciona e quando contratar",
    subtitle:
      "Entenda o trabalho por trás de campanhas em Google Ads e Meta Ads e o que avaliar antes de investir.",
    slug: "gestao-de-trafego-pago-como-funciona",
    excerpt:
      "Saiba o que faz uma gestão de tráfego pago, quais etapas fazem parte do serviço e quando uma empresa está pronta para anunciar.",
    seoTitle: "Gestão de Tráfego Pago: Como Funciona | Kivai",
    metaDescription:
      "Entenda como funciona a gestão de tráfego pago em Google Ads e Meta Ads, quais são as entregas e quando contratar o serviço.",
    tags: ["Tráfego Pago", "Google Ads", "Meta Ads", "Marketing Digital"],
    relatedToolSlugs: ["calculadora-de-roas", "calculadora-de-roi"],
    content: `
      <p>Anunciar na internet parece simples quando a plataforma oferece um botão para impulsionar uma publicação ou criar uma campanha. O desafio começa quando a empresa precisa escolher objetivos, públicos, palavras-chave, orçamento, anúncios e formas de medir o que aconteceu. A <a href="/servicos/gestao-de-trafego"><strong>gestão de tráfego pago</strong></a> organiza essas decisões e acompanha as campanhas ao longo do tempo.</p>
      <p>O serviço não se resume a colocar anúncios no ar. Uma operação profissional começa pelo entendimento do negócio, passa pela configuração técnica e exige leitura recorrente dos dados para reduzir desperdícios e identificar oportunidades.</p>
      <h2>O que é gestão de tráfego pago?</h2>
      <p>Gestão de tráfego pago é o planejamento, a criação, a configuração e a otimização de campanhas em plataformas de mídia. Entre os canais mais utilizados estão Google Ads e Meta Ads. A escolha depende do comportamento do público e do objetivo da empresa.</p>
      <p>No Google Ads, campanhas de pesquisa podem alcançar pessoas que já procuram um produto, serviço ou solução. No Meta Ads, anúncios no Instagram e Facebook podem apresentar ofertas e conteúdos a públicos definidos por localização, interesses e outros sinais disponíveis na plataforma.</p>
      <h2>Quais etapas fazem parte do serviço?</h2>
      <h3>Entendimento do negócio</h3>
      <p>Antes de anunciar, é necessário compreender a oferta, o público, a região atendida, o processo comercial e a capacidade de investimento. Uma campanha pode gerar cliques e contatos, mas precisa estar conectada a uma estrutura capaz de atender e vender.</p>
      <h3>Planejamento da estratégia</h3>
      <p>Nessa etapa são definidos canais, objetivos, campanhas, segmentações e orçamento. Também é importante decidir para onde o anúncio levará o usuário: site, landing page, loja, formulário ou WhatsApp.</p>
      <h3>Configuração de campanhas e anúncios</h3>
      <p>A estrutura inclui grupos, palavras-chave quando aplicável, públicos, anúncios, extensões, eventos de conversão e parâmetros de acompanhamento. Uma configuração organizada facilita a análise posterior.</p>
      <h3>Acompanhamento e otimização</h3>
      <p>Depois da publicação, o desempenho precisa ser observado. Termos de pesquisa, custo por clique, taxa de conversão, frequência, alcance e qualidade dos contatos ajudam a orientar ajustes. Nem toda mudança deve ser feita rapidamente: é preciso considerar volume de dados e contexto.</p>
      <h2>Quais problemas a gestão ajuda a resolver?</h2>
      <ul>
        <li>Campanhas sem objetivo ou estrutura clara;</li>
        <li>Orçamento distribuído sem prioridades;</li>
        <li>Palavras-chave e públicos amplos demais;</li>
        <li>Dificuldade para identificar quais anúncios geram contatos;</li>
        <li>Falta de acompanhamento e decisões baseadas apenas em impressão.</li>
      </ul>
      <h2>Quando uma empresa está pronta para anunciar?</h2>
      <p>Antes de investir, a empresa precisa ter uma oferta compreensível, um canal de destino funcional e capacidade para atender os contatos. Uma boa <a href="/servicos/criacao-de-landing-pages">landing page</a> pode ajudar quando o site atual não explica claramente o serviço ou oferece caminhos demais ao visitante.</p>
      <p>Também é importante separar a verba de mídia do valor da gestão. O dinheiro investido nas plataformas paga a distribuição dos anúncios; o serviço profissional cobre o planejamento e o acompanhamento da operação.</p>
      <h2>É possível garantir vendas?</h2>
      <p>Não existe garantia responsável de vendas. O resultado depende de mercado, preço, oferta, concorrência, página, atendimento, orçamento e vários outros fatores. A gestão trabalha para melhorar a qualidade da estrutura e das decisões, mas não controla todas as etapas do negócio.</p>
      <h2>Quando contratar um gestor de tráfego?</h2>
      <p>A contratação é indicada quando a empresa quer investir com método, precisa corrigir campanhas existentes ou não possui tempo e conhecimento para acompanhar as plataformas. <a href="/servicos/gestao-de-trafego"><strong>Conheça a gestão de tráfego pago do Kivai</strong></a> e converse sobre os objetivos do seu negócio.</p>
    `,
  },
  {
    title: "Landing page profissional: quando sua empresa precisa de uma",
    subtitle:
      "Descubra quando uma página focada é mais adequada do que direcionar campanhas para uma página genérica.",
    slug: "landing-page-profissional-quando-criar",
    excerpt:
      "Veja o que é uma landing page profissional, quais problemas ela resolve e como estruturar uma página para serviços, produtos e campanhas.",
    seoTitle: "Landing Page Profissional: Quando Criar uma | Kivai",
    metaDescription:
      "Saiba quando criar uma landing page profissional e como uma página rápida e responsiva pode apoiar campanhas, produtos, serviços e eventos.",
    tags: ["Landing Page", "Conversão", "Sites", "Marketing Digital"],
    relatedToolSlugs: [],
    content: `
      <p>Uma campanha pode gerar interesse e ainda assim perder oportunidades quando o visitante chega a uma página confusa. Menus extensos, informações dispersas e várias chamadas concorrendo pela atenção dificultam o próximo passo. A <a href="/servicos/criacao-de-landing-pages"><strong>criação de uma landing page profissional</strong></a> ajuda a concentrar a comunicação em uma oferta e uma ação principal.</p>
      <p>Landing pages podem ser utilizadas por empresas, profissionais, eventos, artistas e projetos. A estrutura muda conforme o objetivo, mas a lógica permanece: apresentar uma mensagem clara, responder às principais dúvidas e orientar o visitante.</p>
      <h2>O que é uma landing page?</h2>
      <p>Landing page é uma página criada para receber visitantes de uma campanha, link, anúncio, rede social ou ação específica. Diferentemente de um site institucional completo, ela reduz caminhos paralelos e organiza o conteúdo em torno de uma conversão.</p>
      <p>Essa conversão pode ser uma conversa pelo WhatsApp, o envio de um formulário, uma inscrição, uma compra, o download de um material ou o acesso a outra etapa do processo.</p>
      <h2>Quando criar uma landing page profissional?</h2>
      <h3>Para divulgar um serviço específico</h3>
      <p>Quando a empresa oferece vários serviços, uma página dedicada permite explicar um deles com mais profundidade. Isso facilita a criação de anúncios e links com mensagens coerentes do início ao fim.</p>
      <h3>Para lançar um produto ou campanha</h3>
      <p>Lançamentos precisam concentrar benefícios, diferenciais, informações de disponibilidade e chamadas para ação. Uma página própria evita que o visitante procure essas informações em diferentes canais.</p>
      <h3>Para eventos e projetos temporários</h3>
      <p>Datas, localização, programação, ingressos e orientações podem ser reunidos em um único endereço. A mesma lógica atende casamentos, festivais, campanhas solidárias e projetos culturais.</p>
      <h3>Quando o negócio ainda não possui um site</h3>
      <p>Uma landing page pode ser o primeiro passo para criar presença digital própria. Ela não precisa tentar reproduzir um portal completo: deve apresentar o essencial com qualidade e permitir contato.</p>
      <h2>Quais elementos uma landing page deve ter?</h2>
      <ul>
        <li>Título que explique rapidamente a proposta;</li>
        <li>Descrição clara do produto, serviço ou projeto;</li>
        <li>Benefícios e diferenciais relevantes para o público;</li>
        <li>Provas, informações ou respostas que reduzam dúvidas;</li>
        <li>Chamada para ação visível e coerente;</li>
        <li>Experiência responsiva para celular, tablet e computador.</li>
      </ul>
      <h2>Landing page e tráfego pago</h2>
      <p>Uma campanha de <a href="/servicos/gestao-de-trafego">tráfego pago</a> precisa de um destino alinhado ao anúncio. Se a promessa do anúncio não aparece claramente na página, o visitante pode sair sem avançar. Uma landing page ajuda a manter continuidade entre pesquisa, anúncio, conteúdo e ação.</p>
      <h2>Quais problemas a página ajuda a resolver?</h2>
      <p>Ela reduz a dispersão de informações, cria um endereço próprio para a oferta, melhora a apresentação em dispositivos móveis e oferece um caminho claro para contato ou conversão. Também permite que campanhas diferentes tenham mensagens específicas.</p>
      <h2>Uma landing page substitui um site completo?</h2>
      <p>Depende da necessidade. Empresas com muitas áreas, conteúdos e funcionalidades podem precisar de um site completo. Para uma campanha, oferta ou presença inicial, uma página focada costuma ser suficiente e mais objetiva.</p>
      <p>Se sua empresa precisa apresentar uma ideia com clareza, <a href="/servicos/criacao-de-landing-pages"><strong>conheça o serviço de criação de landing pages do Kivai</strong></a> e veja como estruturar uma página para seu objetivo.</p>
    `,
  },
  {
    title: "Divulgação para artistas e bandas: como ampliar o alcance de lançamentos",
    subtitle:
      "Um guia para preparar músicas, clipes e shows para circular em diferentes canais digitais.",
    slug: "divulgacao-para-artistas-e-bandas",
    excerpt:
      "Aprenda a organizar a divulgação de músicas, clipes, shows e lançamentos e entenda como ampliar os pontos de contato de um projeto musical.",
    seoTitle: "Divulgação para Artistas e Bandas: Guia | Kivai",
    metaDescription:
      "Veja como divulgar músicas, clipes, shows e lançamentos. Organize materiais, canais e mensagens para ampliar o alcance do projeto musical.",
    tags: ["Divulgação Musical", "Artistas", "Bandas", "Lançamento Musical"],
    relatedToolSlugs: [],
    content: `
      <p>Lançar uma música exige mais do que disponibilizar o arquivo em uma plataforma. O público precisa descobrir o projeto, entender a proposta e encontrar caminhos para ouvir, assistir, acompanhar ou compartilhar. Um serviço de <a href="/servicos/divulgacao-artistas"><strong>divulgação para artistas e bandas</strong></a> amplia os pontos de contato do lançamento e ajuda o material a circular além do perfil do próprio artista.</p>
      <p>Isso não significa repetir a mesma publicação em todos os lugares. Cada canal possui formatos, públicos e comportamentos diferentes. O planejamento deve considerar o material disponível, a fase do lançamento e a mensagem principal.</p>
      <h2>O que pode ser divulgado em um projeto musical?</h2>
      <ul>
        <li>Singles, álbuns e EPs;</li>
        <li>Videoclipes, lyric videos e registros ao vivo;</li>
        <li>Shows, festivais, turnês e agendas;</li>
        <li>Entrevistas, bastidores e histórias do projeto;</li>
        <li>Campanhas, financiamentos e ações especiais;</li>
        <li>Novidades de artistas, bandas, produtores e selos.</li>
      </ul>
      <h2>Como preparar um lançamento para divulgação</h2>
      <h3>Organize as informações essenciais</h3>
      <p>Nome do artista, título do lançamento, data, links oficiais, ficha técnica e uma descrição curta precisam estar corretos. Quem recebe o material deve compreender rapidamente o que está sendo divulgado.</p>
      <h3>Escolha imagens e vídeos adequados</h3>
      <p>Capas, fotos de divulgação, trechos verticais e vídeos ajudam a adaptar a mensagem aos diferentes formatos. Materiais com boa leitura no celular facilitam a publicação em redes sociais.</p>
      <h3>Defina a mensagem principal</h3>
      <p>O que torna a música, o clipe ou o show relevante? A resposta pode estar no gênero, na história, na colaboração, no tema da letra ou no momento da carreira. Uma mensagem clara é mais memorável do que uma lista extensa de informações.</p>
      <h3>Planeje antes, durante e depois</h3>
      <p>A divulgação não precisa acontecer apenas no dia do lançamento. É possível criar expectativa, apresentar detalhes, publicar o material e depois explorar bastidores, repercussão, apresentações e conteúdos derivados.</p>
      <h2>Por que divulgar em diferentes plataformas?</h2>
      <p>Um seguidor do Instagram não é necessariamente a mesma pessoa que acompanha conteúdos no TikTok, YouTube ou Kwai. Uma rede multiplataforma aumenta as possibilidades de descoberta e reduz a dependência de um único algoritmo.</p>
      <p>Os formatos também mudam. Um vídeo curto pode despertar curiosidade, enquanto um conteúdo no YouTube permite aprofundamento. Perfis temáticos podem apresentar o projeto a pessoas que ainda não conhecem o artista.</p>
      <h2>Divulgação orgânica e impulsionamento</h2>
      <p>Publicação orgânica e mídia paga são frentes diferentes. A primeira utiliza a audiência e a distribuição natural dos perfis. O impulsionamento adiciona investimento para alcançar públicos definidos. É importante verificar claramente o que está incluído em cada plano.</p>
      <h2>É possível garantir visualizações?</h2>
      <p>Não. Alcance, visualizações, seguidores e curtidas variam conforme plataforma, interesse do público, qualidade do conteúdo e momento da publicação. Uma divulgação responsável apresenta canais e entregas sem prometer um resultado que não pode controlar.</p>
      <h2>Quando contratar uma rede de divulgação?</h2>
      <p>O serviço pode complementar o trabalho do artista quando o projeto precisa alcançar novos públicos, criar mais presença no período de lançamento ou distribuir materiais em canais adicionais. Ele também ajuda equipes pequenas que não possuem uma rede própria de divulgação.</p>
      <p>O Kivai oferece opções para publicação direta e divulgação com mais destaque. <a href="/servicos/divulgacao-artistas"><strong>Conheça os planos de divulgação para artistas e bandas</strong></a> e escolha a estrutura compatível com o seu projeto.</p>
    `,
  },
];

const targetSlugs = posts.map((post) => post.slug);
const existing = await request(
  `blog_posts?select=id,slug,published_at&slug=in.(${targetSlugs.map(encodeURIComponent).join(",")})`,
);
const existingBySlug = new Map(existing.map((post) => [post.slug, post]));
const now = new Date().toISOString();

for (const post of posts) {
  const canonicalUrl = `https://www.kivai.com.br/blog/${post.slug}`;
  const rows = await request("blog_posts?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content.trim(),
      status: "published",
      author: "Kivai",
      category_id: marketingCategory.id,
      seo_title: post.seoTitle,
      meta_description: post.metaDescription,
      canonical_url: canonicalUrl,
      og_title: post.seoTitle.replace(/ \| Kivai$/, ""),
      og_description: post.metaDescription,
      related_tool_slugs: post.relatedToolSlugs,
      featured: false,
      origin: "manual",
      review_status: "not-required",
      needs_cover: false,
      published_at: existingBySlug.get(post.slug)?.published_at || now,
      scheduled_at: null,
    }),
  });

  const saved = rows[0];
  if (!saved) throw new Error(`Falha ao publicar ${post.slug}.`);

  const tagRows = await request("blog_tags?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(
      post.tags.map((name) => ({
        name,
        slug: name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      })),
    ),
  });

  await request(`blog_post_tags?post_id=eq.${encodeURIComponent(saved.id)}`, {
    method: "DELETE",
  });
  await request("blog_post_tags", {
    method: "POST",
    body: JSON.stringify(
      tagRows.map((tag) => ({ post_id: saved.id, tag_id: tag.id })),
    ),
  });
}

const verified = await request(
  `blog_posts?select=title,slug,status,canonical_url&slug=in.(${targetSlugs.map(encodeURIComponent).join(",")})&order=slug.asc`,
);

if (verified.length !== posts.length || verified.some((post) => post.status !== "published")) {
  throw new Error("A verificação dos artigos publicados falhou.");
}

console.log(
  JSON.stringify(
    verified.map((post) => ({
      title: post.title,
      slug: post.slug,
      status: post.status,
      canonicalUrl: post.canonical_url,
    })),
    null,
    2,
  ),
);
