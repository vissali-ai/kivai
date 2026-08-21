export type PdfSpecialToolEditorialSlug =
  | "pdf-para-html"
  | "html-para-pdf"
  | "editar-pdf"
  | "desbloquear-pdf"
  | "redimensionar-pdf"
  | "montar-pdf-para-impressao";

type EditorialContent = {
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
};

export const pdfSpecialToolEditorialContent = {
  "pdf-para-html": {
    overview: [
      "PDF para HTML transforma o conteúdo textual de um PDF digital em um documento HTML que pode ser visualizado, editado e reutilizado na web. A ferramenta trabalha com o texto existente no arquivo e oferece um modo estruturado, voltado à semântica, e um modo visual, que tenta aproximar o posicionamento original.",
      "PDF e HTML possuem modelos diferentes: PDF prioriza páginas fixas, enquanto HTML reorganiza o conteúdo conforme tela, fontes e CSS. Por isso, documentos simples, com texto selecionável e uma coluna, tendem a produzir resultados mais previsvisíveis que layouts com múltiplas colunas, gráficos ou elementos sobrepostos.",
    ],
    useCases: [
      { title: "Migrar conteúdo para sites", description: "Recupere títulos, parágrafos e listas de manuais, relatórios e materiais que existem apenas em PDF." },
      { title: "Preparar artigos e páginas", description: "Use o HTML gerado como ponto de partida para conteúdo editorial, documentação ou áreas administrativas." },
      { title: "Revisar estrutura", description: "Compare a visualização com o código e faça pequenos ajustes antes de reutilizar o conteúdo." },
      { title: "Selecionar páginas", description: "Converta apenas intervalos úteis quando o documento completo não precisa ser transformado." },
    ],
    steps: [
      "Selecione um PDF digital com texto selecionável.",
      "Informe as páginas desejadas ou deixe o campo vazio para usar todas.",
      "Escolha HTML estruturado ou Preservar aparência e inicie a conversão.",
      "Revise a visualização e o código antes de copiar ou baixar o arquivo HTML.",
    ],
    specifications: [
      { label: "Entrada", value: "PDF digital compatível, dentro dos limites apresentados pela ferramenta." },
      { label: "Saída", value: "Documento HTML5 em UTF-8 com CSS incorporado quando necessário." },
      { label: "Modos", value: "Estruturado, para títulos e parágrafos, ou visual, para aproximar posições." },
      { label: "Edição", value: "O código gerado pode ser revisado, localizado, editado, restaurado e copiado antes do download." },
    ],
    privacy: "A inspeção, a extração de texto e a geração do HTML acontecem no navegador com os módulos locais da ferramenta. O PDF não precisa ser enviado a um serviço externo para essa conversão.",
    limitations: [
      "A versão atual não executa OCR; PDFs compostos somente por imagens precisam de reconhecimento de texto antes.",
      "Imagens incorporadas ao PDF podem não ser recuperadas de maneira confiável no HTML.",
      "Tabelas complexas, múltiplas colunas, fontes específicas e elementos vetoriais podem exigir revisão manual.",
      "O modo visual prioriza aparência e pode gerar um HTML menos flexível em telas pequenas.",
    ],
    faqs: [
      { question: "O HTML gerado pode ser editado?", answer: "Sim. A ferramenta permite revisar o código, fazer pequenos ajustes e restaurar a versão originalmente gerada." },
      { question: "PDF digitalizado funciona?", answer: "Não diretamente quando a página contém apenas imagem. Esta versão não inclui OCR." },
      { question: "Posso converter apenas algumas páginas?", answer: "Sim. São aceitos números, listas e intervalos, como 1-5,8." },
      { question: "O layout ficará idêntico ao PDF?", answer: "Não necessariamente. PDF é fixo e HTML é fluido; o modo visual apenas aproxima o posicionamento original." },
      { question: "Posso usar o HTML em um site?", answer: "Sim, desde que você tenha autorização sobre o conteúdo e revise estilos, acessibilidade e links antes de publicar." },
    ],
    related: [
      { href: "/ferramentas/html-para-pdf", label: "HTML para PDF" },
      { href: "/ferramentas/pdf-para-word", label: "PDF para Word" },
      { href: "/ferramentas/pdf-para-excel", label: "PDF para Excel" },
      { href: "/ferramentas/pdf-para-imagens", label: "PDF para Imagens" },
      { href: "/ferramentas/editar-pdf", label: "Editar PDF" },
    ],
  },
  "html-para-pdf": {
    overview: [
      "HTML para PDF renderiza código HTML em páginas de PDF configuráveis. O conteúdo pode ser colado diretamente no editor ou carregado a partir de um arquivo .html ou .htm, com prévia segura antes da geração.",
      "A ferramenta sanitiza o HTML antes de renderizar e permite escolher tamanho de papel, orientação, margens, escala, cabeçalho, rodapé e numeração. É indicada para documentos cujo conteúdo já existe em HTML e precisa ganhar uma versão fixa para leitura, envio ou impressão.",
    ],
    useCases: [
      { title: "Relatórios e propostas", description: "Transforme documentos HTML em uma versão estável para compartilhar com clientes ou equipes." },
      { title: "Recibos e tabelas", description: "Gere PDFs de conteúdos estruturados que já possuem HTML e CSS próprios." },
      { title: "Materiais para impressão", description: "Defina papel, orientação e margens antes de criar a versão final." },
      { title: "Documentação", description: "Converta fragmentos ou páginas completas sem depender de um editor de desktop." },
    ],
    steps: [
      "Cole o HTML no editor ou envie um arquivo .html ou .htm.",
      "Revise a visualização sanitizada e ajuste o conteúdo se necessário.",
      "Escolha tamanho, orientação, margens, escala e elementos de cabeçalho ou rodapé.",
      "Gere o PDF, confira a prévia e baixe o arquivo final.",
    ],
    specifications: [
      { label: "Entrada", value: "HTML completo ou fragmentos, inclusive arquivo .html/.htm de até 5 MB." },
      { label: "Papel", value: "A4, A5, A3, Carta e Ofício, em retrato ou paisagem." },
      { label: "Ajustes", value: "Margens predefinidas ou personalizadas, escala, cabeçalho, rodapé e paginação." },
      { label: "Saída", value: "PDF renderizado a partir da visualização sanitizada do HTML." },
    ],
    privacy: "O HTML é sanitizado, visualizado e convertido no próprio navegador. O conteúdo não precisa ser enviado ao Kivai para gerar o PDF.",
    limitations: [
      "Recursos externos, como fontes, imagens remotas e folhas de estilo, podem ser bloqueados ou falhar; conteúdo incorporado é mais previsível.",
      "Scripts, formulários, iframes, objetos e URLs perigosas são removidos pela sanitização.",
      "CSS avançado, quebras complexas e recursos específicos de navegador podem produzir diferenças no PDF.",
      "A renderização visual não garante que links permaneçam clicáveis no arquivo final.",
    ],
    faqs: [
      { question: "Posso colar apenas um fragmento HTML?", answer: "Sim. O conteúdo não precisa ser um documento HTML completo." },
      { question: "O CSS será mantido?", answer: "Estilos inline e regras comuns em style tendem a funcionar, mas CSS avançado pode apresentar diferenças." },
      { question: "Posso usar orientação paisagem?", answer: "Sim. Retrato e paisagem estão disponíveis antes da conversão." },
      { question: "Posso adicionar números nas páginas?", answer: "Sim. A ferramenta permite habilitar número e total de páginas no rodapé." },
      { question: "Imagens externas sempre aparecem?", answer: "Não. Para maior previsibilidade, use imagens incorporadas ou recursos locais compatíveis." },
    ],
    related: [
      { href: "/ferramentas/pdf-para-html", label: "PDF para HTML" },
      { href: "/ferramentas/word-para-pdf", label: "Word para PDF" },
      { href: "/ferramentas/imagens-para-pdf", label: "Imagens para PDF" },
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
      { href: "/ferramentas/montar-pdf-para-impressao", label: "Montar PDF para Impressão" },
    ],
  },
  "editar-pdf": {
    overview: [
      "Editar PDF permite adicionar novos elementos sobre as páginas de um documento: textos, imagens, formas, linhas, setas, desenhos livres, destaques e assinaturas visuais. Também é possível organizar páginas e gerar uma nova versão em PDF.",
      "O editor não reconstrói diretamente o texto original do documento. A página existente funciona como base e as alterações são aplicadas em novas camadas. Isso torna a ferramenta adequada para anotações, preenchimentos visuais e ajustes de apresentação, mas não para substituir com precisão objetos internos do PDF.",
    ],
    useCases: [
      { title: "Anotações e revisões", description: "Adicione textos, destaques, setas e desenhos em documentos que precisam de marcações." },
      { title: "Assinatura visual", description: "Insira uma assinatura digitada, desenhada ou enviada como imagem, sem confundi-la com certificado digital." },
      { title: "Organização de páginas", description: "Reordene, remova, duplique ou acrescente páginas em branco antes da exportação." },
      { title: "Materiais de trabalho", description: "Inclua logotipos, imagens, instruções e observações sobre formulários e relatórios." },
    ],
    steps: [
      "Selecione o arquivo PDF e aguarde a preparação das páginas.",
      "Abra o editor e escolha a página e a ferramenta desejada.",
      "Adicione e ajuste elementos, posição, tamanho, rotação, cor e opacidade.",
      "Revise o documento e gere uma nova cópia em PDF.",
    ],
    specifications: [
      { label: "Elementos", value: "Texto, imagens PNG/JPG/WebP, formas, linhas, setas, destaque, desenho e assinatura visual." },
      { label: "Páginas", value: "Reordenação, exclusão, duplicação e inserção de páginas em branco." },
      { label: "Histórico", value: "Desfazer e refazer com histórico limitado de ações durante a sessão." },
      { label: "Saída", value: "Novo PDF com as páginas originais e as novas camadas incorporadas." },
    ],
    privacy: "A leitura, a edição e a exportação são executadas pelos módulos do editor no navegador. O documento permanece associado à sessão local durante o uso da ferramenta.",
    limitations: [
      "O texto original do PDF não é substituído diretamente; novas caixas de texto são posicionadas sobre a página.",
      "A assinatura adicionada é visual e não equivale a assinatura digital certificada.",
      "Cobrir uma informação com um retângulo não garante remoção segura do conteúdo interno e não deve ser tratado como redação confidencial.",
      "Fontes, formulários, assinaturas digitais e recursos avançados do PDF devem ser conferidos depois da exportação.",
    ],
    faqs: [
      { question: "Posso alterar o texto original do PDF?", answer: "Não nesta versão. Você pode adicionar uma nova caixa de texto sobre a página." },
      { question: "Posso inserir imagens?", answer: "Sim. O editor aceita PNG, JPG e WebP dentro dos limites informados pela interface." },
      { question: "A assinatura tem validade digital?", answer: "Não. Ela é apenas um elemento visual incorporado ao documento." },
      { question: "Posso reorganizar e excluir páginas?", answer: "Sim. A ferramenta permite mudar a ordem e retirar páginas do arquivo final." },
      { question: "Ocultar conteúdo remove os dados?", answer: "Não necessariamente. A cobertura é visual e não equivale a uma remoção criptograficamente segura." },
    ],
    related: [
      { href: "/ferramentas/girar-pdf", label: "Girar PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/unir-pdfs", label: "Unir PDFs" },
      { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
    ],
  },
  "desbloquear-pdf": {
    overview: [
      "Desbloquear PDF cria uma nova cópia de um documento protegido quando o usuário possui a senha correta ou autorização para remover a restrição. A ferramenta não tenta descobrir, adivinhar ou quebrar senhas.",
      "O PDF original permanece intacto no dispositivo. Quando a proteção exige processamento, o arquivo e a senha informada são enviados ao serviço do Kivai para inspeção e geração da nova versão sem a senha de abertura, quando o formato de segurança é compatível.",
    ],
    useCases: [
      { title: "Documentos próprios", description: "Remova uma senha que você mesmo definiu quando ela deixou de ser necessária no uso cotidiano." },
      { title: "Arquivos empresariais autorizados", description: "Prepare cópias internas de relatórios, formulários ou contratos quando houver permissão para alterar a proteção." },
      { title: "Fluxos de conversão", description: "Crie uma cópia acessível antes de usar ferramentas que não processam PDFs protegidos." },
      { title: "Arquivamento", description: "Gere uma versão sem senha para um acervo autorizado, mantendo o original protegido separado." },
    ],
    steps: [
      "Selecione um PDF que você tem autorização para processar.",
      "Aguarde a inspeção da proteção aplicada ao documento.",
      "Informe a senha correta quando ela for solicitada e inicie o desbloqueio.",
      "Baixe a nova cópia e confira se o documento abre normalmente.",
    ],
    specifications: [
      { label: "Entrada", value: "Um PDF por processamento, dentro dos limites de tamanho e páginas mostrados pela ferramenta." },
      { label: "Autenticação", value: "Senha correta quando a proteção exigir autenticação para abertura ou processamento." },
      { label: "Processamento", value: "Servidor do Kivai, por requisições específicas de inspeção e desbloqueio." },
      { label: "Saída", value: "Nova cópia em PDF, mantendo o arquivo original sem alterações." },
    ],
    privacy: "Diferentemente das ferramentas locais, esta operação usa o backend do Kivai. O arquivo e, quando necessário, a senha são transmitidos ao serviço de processamento para executar a inspeção e o desbloqueio. A interface atual informa que a senha não é armazenada pelo Kivai.",
    limitations: [
      "A ferramenta não descobre nem quebra senhas e exige a credencial correta quando necessária.",
      "Tipos de criptografia incompatíveis ou arquivos danificados podem impedir o processamento.",
      "Modificar a proteção pode afetar assinaturas digitais e outros mecanismos de validação do documento.",
      "Use somente documentos próprios ou para os quais você possua autorização de remoção da proteção.",
    ],
    faqs: [
      { question: "Posso desbloquear um PDF sem saber a senha?", answer: "Não quando a proteção exige senha. A ferramenta não tenta descobrir ou quebrar credenciais." },
      { question: "O arquivo original é alterado?", answer: "Não. O resultado é uma nova cópia em PDF." },
      { question: "O PDF é enviado para um servidor?", answer: "Sim. Esta ferramenta utiliza o backend do Kivai para inspecionar e processar o documento." },
      { question: "A senha é armazenada?", answer: "A interface atual informa que a senha é usada somente para o processamento e não é armazenada pelo Kivai." },
      { question: "Posso usar em qualquer PDF protegido?", answer: "Não. O tipo de proteção precisa ser compatível e você deve ter autorização para removê-la." },
    ],
    related: [
      { href: "/ferramentas/editar-pdf", label: "Editar PDF" },
      { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/unir-pdfs", label: "Unir PDFs" },
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
    ],
  },
  "redimensionar-pdf": {
    overview: [
      "Redimensionar PDF altera o tamanho físico das páginas para formatos como A6, A5, A4, A3, A2 e A1. O usuário também pode definir orientação, margens, fundo, páginas afetadas e a forma como o conteúdo será encaixado na nova área.",
      "A ferramenta trabalha com o conteúdo PDF existente em vez de rasterizar toda a página como uma fotografia. O resultado depende do modo escolhido: Ajustar preserva tudo e pode criar margens; Preencher pode cortar bordas; Esticar altera proporções; Manter tamanho original centraliza o conteúdo sem redimensioná-lo.",
    ],
    useCases: [
      { title: "Preparar impressão", description: "Converta páginas para A4, A3 ou outro formato exigido pela impressora ou gráfica." },
      { title: "Padronizar documentos", description: "Ajuste PDFs com páginas de tamanhos diferentes para um formato comum." },
      { title: "Materiais pequenos", description: "Use A5 ou A6 para apostilas, cartões, convites e peças compactas." },
      { title: "Pôsteres e projetos", description: "Amplie para A3, A2 ou A1 quando o conteúdo precisar ocupar formatos maiores." },
    ],
    steps: [
      "Selecione o PDF e aguarde a leitura das dimensões das páginas.",
      "Escolha o novo tamanho, orientação, modo de ajuste e margens.",
      "Defina se a alteração será aplicada a todas as páginas ou apenas a uma seleção.",
      "Confira a prévia, gere o novo PDF e baixe o resultado.",
    ],
    specifications: [
      { label: "Formatos", value: "A6, A5, A4, A3, A2 e A1, com dimensões físicas padronizadas." },
      { label: "Modos de ajuste", value: "Ajustar, preencher, esticar ou manter o tamanho original." },
      { label: "Margens e fundo", value: "Presets de margem, valores personalizados e opções de preenchimento da área nova." },
      { label: "Aplicação", value: "Todas as páginas, páginas selecionadas ou intervalos informados pelo usuário." },
    ],
    privacy: "A inspeção das páginas, o cálculo do posicionamento e a geração do novo PDF acontecem no navegador com o motor local da ferramenta. O arquivo não precisa ser enviado ao Kivai para ser redimensionado.",
    limitations: [
      "Preencher e manter tamanho original podem cortar conteúdo quando a nova área for menor.",
      "Esticar altera a proporção visual da página e pode deformar textos e imagens.",
      "Imagens de baixa resolução podem evidenciar perda de nitidez quando ampliadas para formatos grandes.",
      "PDFs protegidos, corrompidos ou muito grandes podem não ser processados dentro dos limites da ferramenta.",
    ],
    faqs: [
      { question: "Posso transformar um PDF em A4?", answer: "Sim. A4 está entre os formatos disponíveis, em retrato ou paisagem." },
      { question: "O conteúdo será cortado?", answer: "No modo Ajustar, não. Preencher e Manter tamanho original podem cortar bordas, conforme indicado na prévia." },
      { question: "Posso redimensionar somente algumas páginas?", answer: "Sim. É possível selecionar páginas ou informar intervalos." },
      { question: "O PDF perde qualidade?", answer: "A página não é rasterizada por padrão, mas ampliações podem revelar a resolução limitada das imagens incorporadas." },
      { question: "O processamento é local?", answer: "Sim. O redimensionamento é executado no navegador." },
    ],
    related: [
      { href: "/ferramentas/montar-pdf-para-impressao", label: "Montar PDF para Impressão" },
      { href: "/ferramentas/editar-pdf", label: "Editar PDF" },
      { href: "/ferramentas/girar-pdf", label: "Girar PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
    ],
  },
  "montar-pdf-para-impressao": {
    overview: [
      "Montar PDF para Impressão cria novas folhas e distribui nelas uma ou mais páginas do PDF. Diferentemente de apenas redimensionar a página original, essa ferramenta controla folha, escala, posição, repetição, espaçamento e quantidade de itens em cada composição.",
      "O fluxo é especialmente útil para etiquetas, cartões, documentos pequenos e materiais que precisam aproveitar melhor uma folha A4 ou outro formato. O editor visual permite posicionar, redimensionar e recortar a área usada antes de gerar o novo PDF.",
    ],
    useCases: [
      { title: "Etiquetas de marketplace", description: "Posicione uma etiqueta pequena em uma folha maior para recorte e impressão sem desperdiçar papel." },
      { title: "Cartões e materiais pequenos", description: "Repita o mesmo conteúdo várias vezes na folha e controle espaçamento e distribuição." },
      { title: "Apostilas e documentos", description: "Organize páginas para impressão quando o tamanho original não corresponde ao papel disponível." },
      { title: "Composição personalizada", description: "Use posição, escala e recorte manual para preparar uma folha específica para o seu fluxo." },
    ],
    steps: [
      "Selecione um ou mais PDFs compatíveis e confira as páginas disponíveis.",
      "Escolha o tamanho e a orientação da folha de impressão.",
      "Defina posição, escala, quantidade, repetição, recorte e espaçamento conforme necessário.",
      "Revise a composição visual, gere o novo PDF e baixe o arquivo para imprimir.",
    ],
    specifications: [
      { label: "Folhas", value: "A6, A5, A4, A3, A2, A1, Carta, Ofício e tamanho personalizado conforme a interface." },
      { label: "Distribuição", value: "Posicionamento visual, repetição, ordem, quantidade por folha e espaçamento entre itens." },
      { label: "Escala e recorte", value: "Ajuste manual da escala e edição visual da área útil de cada conteúdo." },
      { label: "Saída", value: "Novo PDF de impressão, mantendo o arquivo de origem sem alterações." },
    ],
    privacy: "Os PDFs são inspecionados, combinados e montados no navegador com os motores locais de layout e geração. O conteúdo não precisa ser enviado ao Kivai para criar a folha de impressão.",
    limitations: [
      "Arquivos protegidos não podem ser montados enquanto a proteção impedir a leitura das páginas.",
      "Composições com muitas páginas ou arquivos grandes podem exigir bastante memória do dispositivo.",
      "O resultado precisa ser conferido antes da impressão física, principalmente quando houver corte, escala manual ou margens específicas da impressora.",
      "A ferramenta prepara o PDF, mas não controla configurações próprias do driver da impressora, como escala automática ou área não imprimível.",
    ],
    faqs: [
      { question: "Posso colocar uma etiqueta pequena em uma folha A4?", answer: "Sim. Escolha A4 como folha e ajuste o tamanho e a posição do conteúdo." },
      { question: "Posso repetir o mesmo documento várias vezes?", answer: "Sim. A ferramenta possui repetição e quantidade de itens por folha." },
      { question: "Qual a diferença para Redimensionar PDF?", answer: "Redimensionar altera a própria página; Montar PDF cria uma nova folha e posiciona um ou vários conteúdos dentro dela." },
      { question: "O PDF original é alterado?", answer: "Não. A saída é uma nova cópia preparada para impressão." },
      { question: "O processamento é local?", answer: "Sim. A montagem e a geração do novo PDF acontecem no navegador." },
    ],
    related: [
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
      { href: "/ferramentas/editar-pdf", label: "Editar PDF" },
      { href: "/ferramentas/girar-pdf", label: "Girar PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/compactar-pdf", label: "Compactar PDF" },
    ],
  },
} satisfies Record<PdfSpecialToolEditorialSlug, EditorialContent>;
