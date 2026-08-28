export const htmlParaPdfEditorialOverride = {
  overview: [
    "HTML para PDF transforma código HTML sanitizado em um documento PDF usando o serviço de renderização do Kivai. O conteúdo pode ser colado diretamente no editor ou carregado a partir de um arquivo .html ou .htm, com visualização segura antes da geração.",
    "A ferramenta renderiza o HTML em Chromium no servidor e permite escolher tamanho de papel, orientação, margens, escala, cabeçalho, rodapé e numeração. Para segurança e previsibilidade, scripts e recursos externos são bloqueados durante a geração do PDF.",
  ],
  useCases: [
    { title: "Relatórios e propostas", description: "Transforme documentos HTML em uma versão fixa para compartilhar com clientes ou equipes." },
    { title: "Recibos e tabelas", description: "Gere PDFs de conteúdos estruturados com HTML e CSS compatíveis incorporados ao próprio documento." },
    { title: "Materiais para impressão", description: "Defina papel, orientação e margens antes de criar a versão final." },
    { title: "Documentação", description: "Converta fragmentos ou documentos HTML completos sem depender de um editor de desktop." },
  ],
  steps: [
    "Cole o HTML no editor ou envie um arquivo .html ou .htm de até 5 MB.",
    "Revise a visualização sanitizada e ajuste o conteúdo se necessário.",
    "Escolha tamanho, orientação, margens, escala, cabeçalho, rodapé e paginação.",
    "Gere o PDF no serviço do Kivai, confira a prévia e baixe o arquivo final.",
  ],
  specifications: [
    { label: "Entrada", value: "HTML completo ou fragmentos, inclusive arquivo .html/.htm de até 5 MB e até 10 mil elementos." },
    { label: "Papel", value: "A4, A5, A3, Carta e Ofício, em retrato ou paisagem." },
    { label: "Ajustes", value: "Margens predefinidas ou personalizadas, escala de 75% a 150%, cabeçalho, rodapé e paginação." },
    { label: "Saída", value: "PDF gerado em Chromium a partir do HTML sanitizado enviado ao backend do Kivai." },
  ],
  privacy: "A visualização é sanitizada no navegador, mas a geração do PDF ocorre no backend do Kivai. O HTML sanitizado e as configurações de impressão são enviados ao serviço de renderização para criar o arquivo; a resposta é devolvida como PDF.",
  limitations: [
    "Requisições externas são bloqueadas durante a renderização. Imagens remotas, Google Fonts, folhas de estilo externas e outros recursos de rede não são carregados.",
    "Para imagens, prefira dados incorporados no próprio HTML, como URLs data:, dentro dos limites da ferramenta.",
    "Scripts, formulários, iframes, objetos, embeds e URLs perigosas são removidos pela sanitização.",
    "Somente um conjunto de propriedades CSS comuns é aceito pelo backend; CSS avançado pode ser removido ou produzir diferenças no PDF.",
    "A renderização não deve ser tratada como uma reprodução pixel a pixel de qualquer página web existente.",
  ],
  faqs: [
    { question: "Posso colar apenas um fragmento HTML?", answer: "Sim. O conteúdo não precisa ser um documento HTML completo." },
    { question: "O CSS será mantido?", answer: "Estilos e regras CSS comuns são aceitos, mas o backend restringe propriedades e remove recursos potencialmente inseguros. CSS avançado pode apresentar diferenças." },
    { question: "Posso usar orientação paisagem?", answer: "Sim. Retrato e paisagem estão disponíveis antes da conversão." },
    { question: "Posso adicionar números nas páginas?", answer: "Sim. A ferramenta permite habilitar número e total de páginas no rodapé." },
    { question: "Imagens externas aparecem no PDF?", answer: "Não. Requisições externas são bloqueadas durante a geração. Para maior previsibilidade, use imagens incorporadas ao próprio HTML, como data URLs." },
    { question: "O HTML é enviado ao servidor?", answer: "Sim. A prévia é sanitizada no navegador e o HTML sanitizado é enviado ao backend do Kivai para a renderização do PDF." },
  ],
  related: [
    { href: "/ferramentas/pdf-para-html", label: "PDF para HTML" },
    { href: "/ferramentas/word-para-pdf", label: "Word para PDF" },
    { href: "/ferramentas/imagens-para-pdf", label: "Imagens para PDF" },
    { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
    { href: "/ferramentas/montar-pdf-para-impressao", label: "Montar PDF para Impressão" },
  ],
} as const;
