export const editarPdfEditorialOverride = {
  overview: [
    "Editar PDF permite adicionar novas camadas sobre as páginas de um documento: textos, imagens, formas, linhas, setas, desenhos livres, destaques e assinaturas visuais. Também é possível reorganizar, remover, duplicar, girar e acrescentar páginas em branco antes de gerar uma nova cópia.",
    "O editor não altera diretamente os objetos internos do PDF original. Cada página existente é usada como base visual e os novos elementos são incorporados sobre ela. Por isso, a ferramenta é indicada para anotações, preenchimentos visuais e ajustes de apresentação, não para substituir com precisão textos, imagens ou objetos que já fazem parte do conteúdo interno do PDF.",
  ],
  useCases: [
    { title: "Anotações e revisões", description: "Adicione textos, destaques, setas, linhas e desenhos em documentos que precisam de marcações visuais." },
    { title: "Assinatura visual", description: "Insira uma assinatura digitada, desenhada ou enviada como imagem. Ela é apenas visual e não substitui certificado ou assinatura digital." },
    { title: "Organização de páginas", description: "Reordene, remova, duplique, gire ou acrescente páginas em branco antes da exportação." },
    { title: "Preenchimentos e complementos", description: "Inclua observações, logotipos, imagens e textos sobre formulários, relatórios e materiais próprios." },
  ],
  steps: [
    "Selecione um PDF de até 25 MB e aguarde a preparação das páginas.",
    "Abra o editor, escolha a página e adicione os elementos desejados.",
    "Ajuste posição, tamanho, rotação, cor, opacidade, ordem das camadas e organização das páginas.",
    "Revise visualmente o resultado e gere uma nova cópia em PDF para download.",
  ],
  specifications: [
    { label: "Entrada", value: "Um PDF de até 25 MB e no máximo 50 páginas. PDFs protegidos não são editados por esta ferramenta." },
    { label: "Elementos", value: "Até 200 elementos adicionados, incluindo texto, imagens, formas, linhas, setas, destaques, desenhos e assinaturas visuais." },
    { label: "Imagens", value: "PNG, JPG e WebP, até 10 MB por imagem e limite de 20 imagens adicionadas ao documento." },
    { label: "Saída", value: "Nova cópia em PDF com as páginas-base e as novas camadas incorporadas." },
  ],
  privacy: "A leitura, a edição e a exportação são executadas localmente no navegador com PDF.js e pdf-lib. O PDF permanece na sessão do dispositivo durante o uso da ferramenta e não precisa ser enviado ao backend do Kivai.",
  limitations: [
    "O texto, imagens e objetos que já existem internamente no PDF não são editados diretamente; novos elementos são posicionados sobre a página-base.",
    "A assinatura adicionada é apenas visual e não equivale a assinatura digital certificada ou baseada em certificado.",
    "Cobrir um conteúdo com retângulo ou destaque não remove os dados internos. Não use essa técnica para ocultar definitivamente informações confidenciais.",
    "A nova cópia é reconstruída a partir das páginas-base. Links, formulários interativos, anotações, assinaturas digitais e outros recursos avançados do PDF podem deixar de funcionar e devem ser conferidos depois da exportação.",
    "O histórico de desfazer/refazer é limitado durante a sessão e documentos complexos podem exigir mais memória do dispositivo.",
  ],
  faqs: [
    { question: "Posso alterar o texto original do PDF?", answer: "Não nesta versão. O editor adiciona uma nova caixa de texto sobre a página, sem substituir diretamente o objeto de texto original." },
    { question: "Posso inserir imagens?", answer: "Sim. São aceitas imagens PNG, JPG e WebP de até 10 MB cada, respeitando o limite de imagens da ferramenta." },
    { question: "A assinatura tem validade digital?", answer: "Não. A assinatura adicionada é um elemento visual e não cria certificado, validação criptográfica ou assinatura digital certificada." },
    { question: "Posso reorganizar e excluir páginas?", answer: "Sim. É possível reordenar, remover, duplicar, girar e inserir páginas em branco antes de gerar a nova cópia." },
    { question: "Cobrir conteúdo remove a informação do PDF?", answer: "Não. A cobertura é visual e o conteúdo original pode continuar existindo internamente na página-base. Não utilize esse recurso como redação segura de dados confidenciais." },
  ],
  related: [
    { href: "/ferramentas/girar-pdf", label: "Girar PDF" },
    { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
    { href: "/ferramentas/unir-pdfs", label: "Unir PDFs" },
    { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
    { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
  ],
} as const;
