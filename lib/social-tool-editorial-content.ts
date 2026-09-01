export type SocialAdvancedEditorialSlug =
  | "calendario-editorial-redes-sociais"
  | "planejador-de-conteudo-social-media"
  | "preview-de-post-redes-sociais"
  | "gerador-de-relatorio-social-media";

export type SocialAdvancedEditorialContent = {
  categoryName: string;
  categoryHref: string;
  applicationCategory: string;
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

const base = {
  categoryName: "Social Media",
  categoryHref: "/ferramentas/social-media",
  applicationCategory: "BusinessApplication",
} as const;

export const socialAdvancedEditorialContent: Record<SocialAdvancedEditorialSlug, SocialAdvancedEditorialContent> = {
  "calendario-editorial-redes-sociais": {
    ...base,
    overview: [
      "O calendário editorial organiza ideias de conteúdo em publicações com data, rede, formato, objetivo e etapa de produção definidos. A visão mensal ajuda a enxergar frequência, distribuição de temas e o que ainda precisa ser produzido, revisado, aprovado ou publicado.",
      "A ferramenta foi pensada para marcas, criadores, profissionais e equipes que precisam transformar ideias soltas em um plano de execução. Ela não agenda publicações nas plataformas; o foco é planejamento, acompanhamento e organização do trabalho editorial.",
    ],
    useCases: [
      { title: "Planejamento mensal", description: "Distribua pautas ao longo do mês e use a visão do calendário para identificar lacunas, repetições e possíveis conflitos de publicação." },
      { title: "Campanhas e lançamentos", description: "Organize conteúdos de aquecimento, lançamento, prova social, relacionamento e conversão em datas específicas." },
      { title: "Fluxo de produção", description: "Acompanhe cada peça da ideia até publicação usando status como em produção, revisão, aprovado e agendado." },
    ],
    steps: [
      "Escolha o mês que deseja organizar.",
      "Adicione uma publicação na data adequada.",
      "Informe rede social, formato, objetivo, tema e demais detalhes necessários.",
      "Atualize o status conforme o conteúdo avança na produção.",
      "Use os filtros para revisar publicações por rede social, formato, objetivo e status.",
      "Exporte o calendário em CSV quando quiser compartilhar ou arquivar uma cópia.",
    ],
    specifications: [
      { label: "Visão", value: "Calendário mensal com múltiplas publicações por dia." },
      { label: "Redes", value: "Permite planejar Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Threads, Pinterest e outras redes." },
      { label: "Organização", value: "Data, rede, formato, objetivo, status e informações editoriais ficam reunidos em cada item." },
      { label: "Exportação", value: "O planejamento pode ser exportado em CSV para backup, compartilhamento ou análise em planilhas." },
      { label: "Persistência", value: "As publicações ficam salvas localmente no navegador utilizado." },
      { label: "Uso recorrente", value: "Itens podem ser duplicados e movidos para outras datas sem recomeçar o preenchimento." },
    ],
    privacy: "O planejamento é armazenado localmente no navegador. Não é necessário conectar contas de redes sociais, e o Kivai não agenda nem publica os conteúdos criados nesta ferramenta.",
    limitations: [
      "O calendário não sincroniza automaticamente entre navegadores ou dispositivos.",
      "Limpar os dados do navegador pode remover o planejamento salvo; exporte o CSV periodicamente como cópia de segurança.",
      "A ferramenta organiza o plano editorial, mas não mede resultados nem garante desempenho das publicações.",
    ],
    faqs: [
      { question: "O que é um calendário editorial para redes sociais?", answer: "É um planejamento visual que organiza temas, formatos, canais, objetivos e etapas de cada publicação ao longo do mês." },
      { question: "Preciso criar uma conta para usar a ferramenta?", answer: "Não. O calendário funciona sem login e pode ser usado diretamente no navegador." },
      { question: "Onde as publicações ficam salvas?", answer: "Os dados são guardados no armazenamento local do navegador e permanecem no dispositivo em que o calendário foi criado." },
      { question: "Posso planejar mais de uma rede social?", answer: "Sim. É possível organizar diferentes redes no mesmo calendário." },
      { question: "É possível adicionar várias publicações no mesmo dia?", answer: "Sim. Cada data aceita várias publicações, mesmo quando pertencem a redes, formatos ou campanhas diferentes." },
      { question: "Como acompanho a produção do conteúdo?", answer: "Use os status disponíveis para visualizar a evolução de cada peça da ideia até a publicação." },
      { question: "Posso duplicar uma publicação recorrente?", answer: "Sim. A opção de duplicar cria uma cópia editável para outra data ou adaptação." },
      { question: "Os filtros alteram meu planejamento?", answer: "Não. Eles apenas mudam a visualização dos conteúdos sem apagar ou modificar as publicações salvas." },
      { question: "Posso exportar o calendário editorial?", answer: "Sim. A exportação em CSV reúne as publicações para abrir em planilhas, compartilhar ou arquivar." },
      { question: "O calendário sincroniza entre celular e computador?", answer: "Não automaticamente. Cada navegador e dispositivo mantém seu próprio armazenamento local." },
    ],
    related: [
      { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo" },
      { href: "/ferramentas/preview-de-post-redes-sociais", label: "Preview de Post" },
      { href: "/ferramentas/gerador-de-relatorio-social-media", label: "Gerador de Relatório" },
      { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de Caracteres" },
    ],
  },
  "planejador-de-conteudo-social-media": {
    ...base,
    overview: [
      "Planejar conteúdo é definir o que comunicar, para quem, com qual objetivo e como a ideia será desenvolvida antes da etapa de produção. O plano conecta tema, público, mensagem principal, formato, abordagem, abertura e chamada para ação em um briefing organizado.",
      "A ferramenta ajuda social medias, agências, equipes internas, designers, videomakers e profissionais autônomos a reduzir improvisos e alinhar entregas. Ela organiza as informações fornecidas pelo usuário e não publica conteúdo automaticamente.",
    ],
    useCases: [
      { title: "Estruturar uma pauta", description: "Transforme uma ideia inicial em um briefing mais claro antes de escrever, gravar ou criar a arte." },
      { title: "Alinhar equipes e clientes", description: "Centralize objetivo, público, formato, mensagem e direcionamento para facilitar revisão e aprovação." },
      { title: "Planejar por canal", description: "Defina uma base de conteúdo e registre as adaptações necessárias para diferentes redes sociais." },
    ],
    steps: [
      "Defina o objetivo principal do conteúdo.",
      "Escolha uma ou mais redes sociais.",
      "Descreva o público que deseja atingir.",
      "Informe tema e mensagem principal.",
      "Escolha pilar, formato e abordagem.",
      "Estruture gancho, tópicos e CTA.",
      "Revise o briefing gerado e ajuste o que for necessário.",
      "Copie, exporte ou imprima o planejamento.",
    ],
    specifications: [
      { label: "Estrutura", value: "Objetivo, público, rede, tema, mensagem, pilar, formato, abordagem, gancho, tópicos e CTA." },
      { label: "Pilares", value: "Podem representar funções recorrentes como educação, autoridade, relacionamento, bastidores e promoção." },
      { label: "Formato", value: "O planejamento pode orientar carrossel, vídeo curto, imagem, texto, story e outros formatos conforme a rede." },
      { label: "Resultado", value: "Briefing organizado para criação, revisão, aprovação e execução do conteúdo." },
      { label: "Exportação", value: "O conteúdo pode ser copiado, exportado em TXT ou impresso." },
      { label: "Persistência", value: "O planejamento atual pode ficar salvo no armazenamento local do navegador." },
    ],
    privacy: "O planejamento é montado com os dados informados pelo usuário e salvo localmente no navegador. A ferramenta não conecta contas sociais, não agenda publicações e não precisa de credenciais de plataformas externas.",
    limitations: [
      "A ferramenta organiza o briefing, mas não garante alcance, engajamento, leads ou vendas.",
      "O mesmo conteúdo pode precisar de adaptações de linguagem, duração e formato entre diferentes plataformas.",
      "Dados salvos localmente não são sincronizados automaticamente entre dispositivos e podem ser removidos ao limpar o navegador.",
    ],
    faqs: [
      { question: "O que é um planejador de conteúdo?", answer: "É uma ferramenta para estruturar objetivo, público, tema, mensagem, formato e desenvolvimento de uma pauta antes da produção." },
      { question: "Para que serve o Planejador de Conteúdo Social Media?", answer: "Ele transforma uma ideia inicial em um briefing organizado para orientar criação, revisão e aprovação." },
      { question: "Qual é a diferença entre planejamento de conteúdo e calendário editorial?", answer: "O planejamento define o que será comunicado e como; o calendário editorial organiza em quais datas cada conteúdo será publicado." },
      { question: "Preciso criar uma conta?", answer: "Não. A ferramenta funciona diretamente no navegador, sem login ou cadastro." },
      { question: "Meus dados ficam salvos?", answer: "O planejamento atual pode ficar salvo no armazenamento local do navegador utilizado." },
      { question: "A ferramenta publica automaticamente nas redes sociais?", answer: "Não. Ela prepara o plano e o briefing, mas não agenda nem publica conteúdo em plataformas externas." },
      { question: "Posso usar o planejamento para clientes?", answer: "Sim. O briefing pode apoiar alinhamentos entre agências, profissionais, equipes internas e clientes." },
      { question: "O que são pilares de conteúdo?", answer: "São categorias recorrentes que orientam a função de uma pauta, como educação, autoridade, relacionamento, bastidores ou promoção." },
      { question: "O que é CTA?", answer: "CTA é a chamada para ação que indica o próximo passo desejado, como salvar, comentar, visitar um site ou entrar em contato." },
      { question: "Posso planejar conteúdo para mais de uma rede?", answer: "Sim, lembrando que linguagem, duração e formato podem precisar de adaptações." },
    ],
    related: [
      { href: "/ferramentas/calendario-editorial-redes-sociais", label: "Calendário Editorial" },
      { href: "/ferramentas/preview-de-post-redes-sociais", label: "Preview de Post" },
      { href: "/ferramentas/gerador-de-relatorio-social-media", label: "Gerador de Relatório" },
      { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de Caracteres" },
    ],
  },
  "preview-de-post-redes-sociais": {
    ...base,
    applicationCategory: "MultimediaApplication",
    overview: [
      "O preview de post reúne identificação do perfil, imagem, proporção e legenda em uma simulação visual para revisão antes da publicação. Ele ajuda a observar hierarquia, enquadramento, quebras de linha e coerência entre texto e imagem.",
      "A visualização é uma composição própria do Kivai e não reproduz oficialmente nenhuma rede social. Interfaces, cortes, tipografia e espaçamento podem mudar conforme plataforma, dispositivo e atualizações dos aplicativos.",
    ],
    useCases: [
      { title: "Revisão antes de publicar", description: "Confira perfil, imagem, proporção e legenda antes de abrir a plataforma oficial." },
      { title: "Aprovação de cliente", description: "Use a simulação como referência visual para apresentar uma proposta de publicação." },
      { title: "Adaptação multirrede", description: "Compare como a mesma base de conteúdo pode ser organizada para diferentes redes sociais." },
    ],
    steps: [
      "Escolha a rede social desejada.",
      "Informe nome e usuário do perfil.",
      "Adicione foto de perfil, se desejar.",
      "Selecione a imagem da publicação.",
      "Escolha proporção e enquadramento.",
      "Digite e revise a legenda.",
      "Compare a composição no preview.",
      "Copie a legenda ou baixe o card em PNG.",
    ],
    specifications: [
      { label: "Plataformas", value: "Simulações próprias para Instagram, Facebook, LinkedIn, X e Threads." },
      { label: "Imagens", value: "Aceita JPG, PNG e WebP de até 12 MB para avatar e publicação." },
      { label: "Enquadramento", value: "Permite ajustar a forma como a imagem ocupa a área do post." },
      { label: "Legenda", value: "O texto pode ser revisado com quebras de linha e copiado para a área de transferência." },
      { label: "Exportação", value: "O card de preview pode ser baixado em PNG sem os controles da ferramenta." },
      { label: "Conta social", value: "Nenhuma conta ou credencial de rede social é necessária." },
    ],
    privacy: "As imagens selecionadas são utilizadas localmente no navegador para montar a simulação. A ferramenta não conecta contas, não publica conteúdo e não envia as imagens para redes sociais.",
    limitations: [
      "O preview não é uma reprodução oficial e pode diferir da interface real das plataformas.",
      "Cortes, tipografia e espaçamentos podem variar conforme dispositivo e atualizações dos aplicativos.",
      "A simulação serve para revisão e apresentação e não prevê desempenho, alcance ou engajamento.",
    ],
    faqs: [
      { question: "O que é um preview de post?", answer: "É uma simulação visual que reúne perfil, imagem e legenda para ajudar na revisão de uma publicação antes de ela ser apresentada ou postada." },
      { question: "A ferramenta publica meu conteúdo?", answer: "Não. O Kivai apenas monta a visualização no navegador e não publica, agenda ou envia conteúdo para redes sociais." },
      { question: "Preciso conectar meu Instagram ou outra conta?", answer: "Não. A ferramenta não solicita acesso a contas ou credenciais de plataformas." },
      { question: "Posso usar uma imagem minha?", answer: "Sim. Você pode selecionar JPG, PNG ou WebP dentro do limite indicado pela ferramenta." },
      { question: "A imagem é enviada para alguma rede social?", answer: "Não. Nesta versão, as imagens são usadas localmente no navegador para gerar o preview." },
      { question: "Quais plataformas possuem visualização?", answer: "A ferramenta oferece composições próprias para Instagram, Facebook, LinkedIn, X e Threads." },
      { question: "O preview é exatamente igual ao aplicativo oficial?", answer: "Não. É uma simulação para revisão e pode diferir do resultado final." },
      { question: "Posso usar o preview para apresentar posts a clientes?", answer: "Sim. Ele pode apoiar apresentação e aprovação, deixando claro que se trata de uma simulação." },
      { question: "Posso copiar minha legenda?", answer: "Sim. A legenda atual pode ser copiada para a área de transferência." },
      { question: "Posso baixar o preview?", answer: "Sim. O card pode ser exportado em PNG." },
    ],
    related: [
      { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo" },
      { href: "/ferramentas/calendario-editorial-redes-sociais", label: "Calendário Editorial" },
      { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de Caracteres" },
    ],
  },
  "gerador-de-relatorio-social-media": {
    ...base,
    overview: [
      "O Gerador de Relatório Social Media organiza métricas de uma rede social em um período definido e transforma os dados informados em uma apresentação visual com comparações, indicadores e gráficos.",
      "A ferramenta não coleta dados automaticamente das plataformas. O usuário transfere as métricas dos analytics oficiais, revisa os cálculos e pode salvar, imprimir ou exportar o relatório para apresentação e acompanhamento.",
    ],
    useCases: [
      { title: "Prestação de contas", description: "Organize indicadores, período, perfil e observações em um documento para clientes ou equipes." },
      { title: "Comparação entre períodos", description: "Registre valores atuais e anteriores para acompanhar variações de audiência, alcance, interações e outros indicadores." },
      { title: "Análise recorrente", description: "Salve relatórios no navegador e mantenha uma rotina de acompanhamento mensal ou por campanha." },
    ],
    steps: [
      "Escolha a rede e identifique cliente, perfil e responsável.",
      "Informe o período analisado.",
      "Adicione audiência, alcance, impressões, interações e conteúdos publicados.",
      "Escolha a base da taxa de engajamento.",
      "Inclua tráfego, conversões ou mídia paga quando esses dados existirem.",
      "Ative a comparação com o período anterior, se necessário.",
      "Adicione destaques, observações e próximos passos.",
      "Revise os indicadores e gráficos antes de salvar, imprimir ou exportar.",
    ],
    specifications: [
      { label: "Métricas", value: "Seguidores, alcance, impressões, interações, cliques, publicações e outras métricas podem ser informadas conforme disponibilidade." },
      { label: "Engajamento", value: "Pode ser calculado com base em seguidores, alcance ou impressões, conforme o método escolhido." },
      { label: "Comparação", value: "Variações absolutas e percentuais ajudam a comparar o período atual com o anterior." },
      { label: "Mídia paga", value: "Investimento, cliques, leads, conversões e receita podem ser adicionados como informações complementares." },
      { label: "Persistência", value: "O relatório em andamento e relatórios salvos ficam no armazenamento local do navegador." },
      { label: "Saída", value: "O resultado pode ser impresso ou exportado em PDF para compartilhamento e apresentação." },
    ],
    privacy: "Os dados são preenchidos manualmente e ficam no navegador nesta versão. A ferramenta não solicita login, token ou acesso às APIs de Instagram, Facebook, TikTok, LinkedIn ou outras redes sociais.",
    limitations: [
      "O gerador não substitui os analytics oficiais das plataformas nem audita a origem dos números informados.",
      "Métricas de redes diferentes podem ter definições e critérios de contagem distintos.",
      "Alcance, engajamento e crescimento não equivalem automaticamente a leads, vendas, receita ou retorno financeiro.",
    ],
    faqs: [
      { question: "O que é um relatório de social media?", answer: "É um documento que organiza métricas de uma rede social em determinado período e ajuda a contextualizar audiência, conteúdo, alcance e interações." },
      { question: "Quais métricas devo colocar no relatório?", answer: "Use as métricas relacionadas aos objetivos do trabalho e disponíveis na plataforma, como seguidores, alcance, impressões, interações, cliques e conversões." },
      { question: "Preciso conectar meu Instagram?", answer: "Não. Os dados são preenchidos manualmente e a ferramenta não solicita login ou acesso à conta." },
      { question: "Posso criar relatório para clientes?", answer: "Sim. É possível identificar cliente, perfil, rede, responsável, período e observações antes da exportação." },
      { question: "Posso comparar dois períodos?", answer: "Sim. A ferramenta permite informar métricas do período anterior e calcular variações quando os dados permitem." },
      { question: "Como é calculada a taxa de engajamento?", answer: "A soma das interações é dividida por seguidores, alcance ou impressões, conforme o método escolhido, e multiplicada por 100." },
      { question: "Posso adicionar resultados de mídia paga?", answer: "Sim. Investimento, impressões, cliques, leads, conversões e receita são opcionais e podem complementar a análise." },
      { question: "Posso baixar o relatório em PDF?", answer: "Sim. O relatório final pode ser exportado ou salvo como PDF conforme os controles disponíveis." },
      { question: "Meus dados ficam salvos?", answer: "O relatório em andamento e relatórios salvos ficam no armazenamento local deste navegador nesta versão." },
      { question: "A ferramenta substitui os analytics das plataformas?", answer: "Não. Ela organiza e calcula os dados fornecidos pelo usuário, sem coleta automática ou auditoria oficial das redes." },
    ],
    related: [
      { href: "/ferramentas/calculadora-de-engajamento", label: "Calculadora de Engajamento" },
      { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo" },
      { href: "/ferramentas/calendario-editorial-redes-sociais", label: "Calendário Editorial" },
      { href: "/ferramentas/preview-de-post-redes-sociais", label: "Preview de Post" },
      { href: "/ferramentas/calculadora-de-roas", label: "Calculadora de ROAS" },
      { href: "/ferramentas/calculadora-de-roi", label: "Calculadora de ROI" },
    ],
  },
};
