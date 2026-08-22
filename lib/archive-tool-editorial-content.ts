export type ArchiveToolEditorialSlug =
  | "descompactar-zip"
  | "descompactar-rar"
  | "compactar-arquivos-zip"
  | "renomear-arquivos-em-lote"
  | "adicionar-prefixo-sufixo-arquivos";

export type ArchiveToolEditorialContent = {
  name: string;
  description: string;
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

const related = [
  { href: "/ferramentas/descompactar-zip", label: "Descompactar ZIP" },
  { href: "/ferramentas/descompactar-rar", label: "Descompactar RAR" },
  { href: "/ferramentas/compactar-arquivos-zip", label: "Compactar Arquivos em ZIP" },
  { href: "/ferramentas/renomear-arquivos-em-lote", label: "Renomear Arquivos em Lote" },
  { href: "/ferramentas/adicionar-prefixo-sufixo-arquivos", label: "Adicionar Prefixo ou Sufixo" },
];

function withRelated(
  slug: ArchiveToolEditorialSlug,
  content: Omit<ArchiveToolEditorialContent, "related">,
): ArchiveToolEditorialContent {
  return { ...content, related: related.filter((item) => item.href !== `/ferramentas/${slug}`) };
}

export const archiveToolEditorialContent: Record<ArchiveToolEditorialSlug, ArchiveToolEditorialContent> = {
  "descompactar-zip": withRelated("descompactar-zip", {
    name: "Descompactar ZIP",
    description: "Abra arquivos ZIP, visualize o conteúdo e extraia arquivos diretamente no navegador.",
    overview: [
      "Um arquivo ZIP funciona como um pacote que pode reunir documentos, imagens, planilhas, pastas e outros tipos de arquivo. Descompactar significa abrir esse pacote e recuperar os itens armazenados nele para uso normal.",
      "Nesta ferramenta, a leitura e a extração acontecem no próprio navegador. O arquivo selecionado não precisa ser enviado ao servidor do Kivai para que seu conteúdo seja listado ou extraído.",
    ],
    useCases: [
      { title: "Downloads e anexos", description: "Abra pacotes ZIP recebidos por e-mail, downloads, sistemas ou serviços de armazenamento sem instalar outro programa." },
      { title: "Conferir o conteúdo", description: "Visualize arquivos e pastas antes de decidir quais itens deseja baixar." },
      { title: "Extração pontual", description: "Baixe apenas os arquivos necessários, sem alterar o ZIP original." },
    ],
    steps: ["Selecione um arquivo com extensão .zip.", "Aguarde a leitura da estrutura do pacote.", "Confira os arquivos e pastas encontrados.", "Baixe individualmente os itens de que precisa."],
    specifications: [
      { label: "Formato aceito", value: "Arquivo ZIP (.zip)." },
      { label: "Limite do pacote", value: "Até 200 MB por ZIP nesta versão." },
      { label: "Quantidade de itens", value: "Até 3.000 entradas entre arquivos e pastas." },
      { label: "Resultado", value: "Lista do conteúdo e download individual dos arquivos encontrados." },
    ],
    privacy: "A leitura e a extração são executadas localmente no navegador. O ZIP não é enviado ao servidor do Kivai para processamento.",
    limitations: ["ZIPs protegidos por senha ou criados com métodos de compressão incompatíveis podem não ser abertos.", "Pacotes grandes ou com muitos itens usam memória do dispositivo e podem funcionar melhor em computador.", "Descompactar um arquivo não torna o conteúdo interno seguro; verifique a origem antes de abrir arquivos desconhecidos."],
    faqs: [
      { question: "O arquivo ZIP é enviado para o Kivai?", answer: "Não. A leitura e a extração são executadas localmente no navegador." },
      { question: "A ferramenta também abre RAR?", answer: "Não nesta página. Para RAR, use a ferramenta Descompactar RAR do Hub Arquivos." },
      { question: "O ZIP original é modificado?", answer: "Não. A ferramenta apenas lê o pacote e gera downloads dos arquivos selecionados." },
      { question: "Posso baixar todos os arquivos de uma vez?", answer: "Nesta versão, os arquivos internos são baixados individualmente para manter compatibilidade e controle de memória no navegador." },
    ],
  }),
  "descompactar-rar": withRelated("descompactar-rar", {
    name: "Descompactar RAR",
    description: "Abra arquivos RAR e extraia itens compatíveis localmente no navegador.",
    overview: [
      "RAR é um formato de arquivo compactado usado para reunir um ou vários itens em um único pacote. A ferramenta permite abrir o RAR, visualizar sua estrutura e extrair arquivos individualmente.",
      "O processamento utiliza WebAssembly e acontece localmente no navegador. O arquivo RAR selecionado não é enviado ao servidor do Kivai para ser descompactado.",
    ],
    useCases: [
      { title: "Abrir um pacote RAR", description: "Confira os arquivos e pastas armazenados antes de fazer qualquer extração." },
      { title: "RAR protegido por senha", description: "Informe a senha quando o pacote exigir autenticação para leitura ou extração." },
      { title: "Extrair somente o necessário", description: "Baixe um arquivo por vez para reduzir o uso de memória do navegador." },
    ],
    steps: ["Selecione um arquivo com extensão .rar.", "Informe a senha somente se o pacote estiver protegido.", "Clique em Abrir RAR para listar o conteúdo.", "Escolha o arquivo desejado e faça o download."],
    specifications: [
      { label: "Formato aceito", value: "Arquivo RAR (.rar), incluindo RAR modernos compatíveis com o mecanismo utilizado." },
      { label: "Limite do pacote", value: "Até 120 MB por arquivo RAR nesta versão." },
      { label: "Quantidade de itens", value: "Até 3.000 entradas no pacote." },
      { label: "Extração individual", value: "Até 350 MB por arquivo interno para reduzir risco de travamento do navegador." },
    ],
    privacy: "O RAR é processado localmente com WebAssembly. O conteúdo do pacote não é enviado ao servidor do Kivai durante a abertura ou extração.",
    limitations: ["Pacotes multipartes, danificados ou criados com recursos incompatíveis podem não ser processados.", "Arquivos grandes dependem da memória disponível no computador ou celular.", "Esta ferramenta apenas abre e descompacta RAR; ela não cria arquivos no formato RAR."],
    faqs: [
      { question: "A ferramenta cria arquivos RAR?", answer: "Não. Esta página é exclusivamente para abrir e descompactar arquivos RAR." },
      { question: "Funciona com RAR 5?", answer: "O mecanismo utilizado oferece suporte a arquivos RAR modernos, incluindo RAR 5, desde que o pacote não use um recurso incompatível." },
      { question: "Posso usar no celular?", answer: "Sim, em navegadores compatíveis. Arquivos grandes, porém, podem exigir mais memória do que alguns celulares conseguem disponibilizar." },
      { question: "Meu arquivo RAR é enviado para o servidor?", answer: "Não. A leitura e a extração são realizadas localmente no navegador." },
    ],
  }),
  "compactar-arquivos-zip": withRelated("compactar-arquivos-zip", {
    name: "Compactar Arquivos em ZIP",
    description: "Reúna vários arquivos em um único pacote ZIP gerado localmente no navegador.",
    overview: [
      "Um arquivo ZIP reúne vários itens em um único pacote, facilitando organização, envio, backup e armazenamento. Dependendo dos formatos selecionados, a compactação também pode reduzir o tamanho total.",
      "Nesta ferramenta, os arquivos são adicionados ao pacote e processados diretamente no navegador. O ZIP resultante é gerado no dispositivo e disponibilizado para download sem enviar os arquivos ao servidor do Kivai.",
    ],
    useCases: [
      { title: "Organizar vários arquivos", description: "Reúna documentos, imagens, planilhas e outros itens em um único pacote." },
      { title: "Compartilhar um conjunto", description: "Crie um único arquivo ZIP para facilitar envio por e-mail, mensageiros ou armazenamento." },
      { title: "Preparar backups", description: "Agrupe arquivos relacionados antes de arquivar ou transferir para outro local." },
    ],
    steps: ["Selecione ou arraste os arquivos que deseja reunir.", "Defina o nome do pacote ZIP.", "Escolha entre compactação rápida, equilibrada ou máxima.", "Clique em Compactar em ZIP e aguarde a geração.", "Baixe o arquivo .zip concluído."],
    specifications: [
      { label: "Formato de saída", value: "Arquivo ZIP (.zip)." },
      { label: "Quantidade de arquivos", value: "Até 1.000 arquivos por operação nesta versão." },
      { label: "Tamanho total", value: "Até 300 MB de arquivos selecionados." },
      { label: "Níveis disponíveis", value: "Rápida, equilibrada e máxima. Maior nível pode consumir mais processamento sem garantir redução proporcional." },
    ],
    privacy: "A compactação acontece localmente no navegador. Os arquivos selecionados permanecem no dispositivo e não são enviados ao servidor do Kivai para gerar o ZIP.",
    limitations: ["Imagens, vídeos, PDFs e outros formatos já comprimidos podem apresentar pouca redução ou até pequeno aumento no ZIP final.", "Operações maiores consomem mais memória e processamento do dispositivo.", "Nomes duplicados são ajustados automaticamente dentro do pacote para evitar sobrescrita silenciosa."],
    faqs: [
      { question: "Os arquivos são enviados para o servidor do Kivai?", answer: "Não. A compactação acontece localmente no navegador e o ZIP é gerado no próprio dispositivo." },
      { question: "Compactar em ZIP sempre reduz o tamanho?", answer: "Não. Formatos que já usam compressão podem apresentar pouca redução ou até um pequeno aumento no tamanho final." },
      { question: "Posso colocar vários arquivos no mesmo ZIP?", answer: "Sim. Você pode reunir vários arquivos em um único pacote dentro dos limites informados pela ferramenta." },
      { question: "A ferramenta cria RAR?", answer: "Não. A saída desta ferramenta é exclusivamente ZIP." },
    ],
  }),
  "renomear-arquivos-em-lote": withRelated("renomear-arquivos-em-lote", {
    name: "Renomear Arquivos em Lote",
    description: "Padronize nomes de vários arquivos com nome base e numeração automática.",
    overview: ["Renomear arquivos em lote ajuda a padronizar grandes conjuntos de documentos, fotos, vídeos, planilhas e outros itens sem editar cada nome manualmente. A ferramenta aplica um nome base e uma sequência numérica mantendo a extensão original de cada arquivo.", "O Kivai mostra uma prévia do nome antigo e do novo nome antes de gerar o resultado. Como navegadores não devem alterar livremente os arquivos originais do computador, as cópias renomeadas são reunidas em um ZIP para download."],
    useCases: [{ title: "Fotos de produtos", description: "Transforme nomes de câmera em sequências organizadas para catálogo e e-commerce." }, { title: "Documentos organizados", description: "Padronize contratos, comprovantes e relatórios antes de arquivar e compartilhar." }, { title: "Conteúdo em lote", description: "Organize arquivos de campanhas, redes sociais, clientes ou projetos usando um padrão consistente." }],
    steps: ["Selecione ou arraste os arquivos que deseja renomear.", "Defina o nome base que será aplicado a todos os itens.", "Escolha o separador, o número inicial e a quantidade de dígitos.", "Confira a prévia dos nomes gerados.", "Baixe o ZIP com as cópias renomeadas."],
    specifications: [{ label: "Quantidade de arquivos", value: "Até 1.000 arquivos por operação nesta versão." }, { label: "Tamanho total", value: "Até 300 MB de arquivos selecionados." }, { label: "Extensões", value: "As extensões originais são preservadas." }, { label: "Resultado", value: "Arquivo ZIP contendo as cópias com os novos nomes." }],
    privacy: "A leitura, a geração dos nomes e a criação do ZIP acontecem localmente no navegador. Os arquivos selecionados não são enviados ao servidor do Kivai para serem renomeados.",
    limitations: ["A ferramenta não altera os arquivos originais; gera cópias renomeadas para download.", "Caracteres inválidos para nomes de arquivo são removidos do nome base para melhorar compatibilidade entre sistemas.", "Operações com muitos arquivos ou arquivos grandes consomem memória do dispositivo durante a geração do ZIP."],
    faqs: [{ question: "Os arquivos originais são modificados?", answer: "Não. O Kivai cria cópias com os novos nomes e reúne essas cópias em um ZIP para download." }, { question: "A extensão do arquivo é mantida?", answer: "Sim. A ferramenta preserva a extensão original de cada item." }, { question: "Posso escolher por qual número começar?", answer: "Sim. Você pode definir o número inicial e a quantidade de dígitos da sequência." }, { question: "Meus arquivos são enviados para o servidor?", answer: "Não. O processamento é executado localmente no navegador." }],
  }),
  "adicionar-prefixo-sufixo-arquivos": withRelated("adicionar-prefixo-sufixo-arquivos", {
    name: "Adicionar Prefixo ou Sufixo em Lote",
    description: "Adicione texto antes ou depois do nome de vários arquivos preservando extensões.",
    overview: ["Adicionar um prefixo ou sufixo em lote permite complementar nomes existentes sem substituir a parte principal do arquivo. É útil para identificar clientes, canais, versões, marketplaces, datas ou outras classificações.", "A ferramenta preserva o nome original e a extensão do arquivo, aplicando somente o texto configurado antes ou depois do nome. O resultado é entregue em ZIP para manter ampla compatibilidade com navegadores."],
    useCases: [{ title: "Marketplaces", description: "Adicione identificadores a conjuntos de imagens e documentos usados em diferentes canais." }, { title: "Clientes e projetos", description: "Inclua o nome de um cliente, campanha ou projeto sem apagar os nomes atuais." }, { title: "Controle de versões", description: "Acrescente marcadores de versão ou data antes da extensão dos arquivos." }],
    steps: ["Selecione ou arraste os arquivos.", "Digite o prefixo, o sufixo ou os dois.", "Confira a prévia com os novos nomes.", "Baixe o ZIP contendo as cópias modificadas."],
    specifications: [{ label: "Quantidade de arquivos", value: "Até 1.000 arquivos por operação nesta versão." }, { label: "Tamanho total", value: "Até 300 MB de arquivos selecionados." }, { label: "Extensões", value: "A extensão permanece no final do arquivo e o sufixo é inserido antes dela." }, { label: "Resultado", value: "Arquivo ZIP com cópias contendo prefixo e/ou sufixo." }],
    privacy: "O processamento e a criação do ZIP acontecem no navegador. Os arquivos não são enviados ao servidor do Kivai para que os nomes sejam alterados.",
    limitations: ["Os arquivos originais permanecem inalterados no dispositivo.", "Caracteres incompatíveis com nomes de arquivo são removidos do prefixo e do sufixo.", "Operações grandes dependem da memória disponível no navegador e no dispositivo."],
    faqs: [{ question: "Posso usar prefixo e sufixo ao mesmo tempo?", answer: "Sim. Você pode preencher somente um dos campos ou combinar prefixo e sufixo na mesma operação." }, { question: "O sufixo é colocado depois da extensão?", answer: "Não. O sufixo é inserido antes da extensão." }, { question: "O nome original é preservado?", answer: "Sim. A ferramenta mantém o nome atual e apenas adiciona os textos configurados." }, { question: "Os arquivos são enviados para o Kivai?", answer: "Não. A operação é executada localmente no navegador." }],
  }),
};
