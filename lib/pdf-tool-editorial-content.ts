type PdfToolEditorialContent = {
  overview: string[];
  useCases: Array<{ title: string; description: string }>;
  steps: string[];
  specifications: Array<{ label: string; value: string }>;
  privacy: string;
  limitations: string[];
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string }>;
};

export type PdfToolEditorialSlug =
  | "pdf-para-imagens"
  | "imagens-para-pdf"
  | "unir-pdfs"
  | "dividir-pdf"
  | "girar-pdf"
  | "compactar-pdf";

export const pdfToolEditorialContent = {
  "pdf-para-imagens": {
    overview: [
      "PDF para Imagens renderiza cada página de um documento e cria uma imagem independente em PNG ou JPG. O conteúdo visual da página — textos, fotografias, gráficos e anotações exibidas — passa a fazer parte de uma imagem plana, adequada para prévias, apresentações e sistemas que não aceitam PDF.",
      "A ferramenta renderiza as páginas com escala ampliada para melhorar a nitidez e permite baixar resultados individualmente ou em conjunto. PNG favorece linhas, capturas e transparência; JPG costuma produzir arquivos menores para páginas fotográficas, mas utiliza compressão com perdas.",
    ],
    useCases: [
      { title: "Prévia de documentos", description: "Crie miniaturas ou imagens de páginas para catálogos, sistemas internos e interfaces que não incorporam PDF." },
      { title: "Apresentações", description: "Transforme uma página finalizada em imagem para inseri-la em slides sem alterar sua composição visual." },
      { title: "Compartilhamento pontual", description: "Envie somente as páginas necessárias em um formato facilmente visualizado em mensagens e redes." },
      { title: "Referência visual", description: "Gere cópias rasterizadas de diagramas, formulários e comprovantes para consulta, preservando o PDF original." },
    ],
    steps: [
      "Selecione um PDF sem senha e aguarde a leitura da quantidade de páginas.",
      "Escolha PNG para maior fidelidade gráfica ou JPG para arquivos geralmente menores.",
      "Inicie a conversão e aguarde a renderização de todas as páginas.",
      "Revise as prévias e baixe imagens individuais ou o conjunto gerado.",
    ],
    specifications: [
      { label: "Entrada", value: "Um arquivo PDF acessível e compatível com o navegador." },
      { label: "Saídas", value: "Uma imagem PNG ou JPG para cada página do documento." },
      { label: "Resolução", value: "Renderização em escala 2 para melhorar a legibilidade em relação ao tamanho básico da página." },
      { label: "Conteúdo", value: "A página vira imagem; texto e links deixam de ser selecionáveis no resultado." },
    ],
    privacy: "O PDF é lido e renderizado pelo PDF.js no navegador. As páginas não precisam ser enviadas ao Kivai. As imagens geradas permanecem associadas à sessão e só são armazenadas no dispositivo quando o usuário faz o download.",
    limitations: [
      "Documentos protegidos por senha ou danificados podem não ser abertos.",
      "A conversão rasteriza a página e não realiza OCR nem extrai texto editável.",
      "PDFs longos ou com páginas grandes podem consumir bastante memória durante a geração.",
      "Fontes ou recursos incomuns podem apresentar diferenças conforme o suporte do renderizador.",
    ],
    faqs: [
      { question: "Cada página vira um arquivo separado?", answer: "Sim. A ferramenta gera uma imagem para cada página e permite baixar os resultados produzidos." },
      { question: "Qual formato devo escolher?", answer: "PNG é indicado para textos, gráficos e capturas nítidas. JPG costuma ser mais leve para páginas com muitas fotografias." },
      { question: "O texto continua selecionável?", answer: "Não. O resultado representa visualmente a página em pixels. Para extrair conteúdo editável, use uma ferramenta de conversão apropriada." },
      { question: "PDF digitalizado funciona?", answer: "Sim, desde que o arquivo possa ser aberto. A página será renderizada como aparece, sem reconhecer automaticamente o texto." },
      { question: "O documento é enviado para um servidor?", answer: "Não. A leitura e a criação das imagens acontecem localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/imagens-para-pdf", label: "Imagens para PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
    ],
  },
  "imagens-para-pdf": {
    overview: [
      "Imagens para PDF reúne arquivos JPG, PNG e WebP em um único documento, colocando uma imagem por página na ordem da seleção. Cada imagem é ajustada proporcionalmente dentro de uma página A4, centralizada e convertida para uma representação compatível com o PDF.",
      "O ajuste respeita a proporção para evitar achatamento e limita a imagem à largura e à altura disponíveis. Áreas transparentes são preenchidas em branco durante a conversão para JPEG. O resultado é indicado para organizar digitalizações, comprovantes, fotografias e artes em um arquivo de leitura contínua.",
    ],
    useCases: [
      { title: "Digitalizações", description: "Agrupe fotografias de páginas, recibos ou anotações em um documento que possa ser arquivado e compartilhado." },
      { title: "Portfólios visuais", description: "Organize artes e fotografias em sequência, com uma peça por página." },
      { title: "Envio de documentos", description: "Converta várias imagens aceitas por um sistema em um único PDF mais fácil de anexar." },
      { title: "Relatórios fotográficos", description: "Reúna registros de etapas, vistorias ou produtos mantendo a ordem escolhida no seletor de arquivos." },
    ],
    steps: [
      "Selecione uma ou várias imagens JPG, PNG ou WebP na ordem desejada.",
      "Confira os nomes e remova ou refaça a seleção caso a sequência esteja incorreta.",
      "Gere o documento e aguarde o processamento local de todas as imagens.",
      "Baixe o PDF e revise a ordem, o enquadramento e a legibilidade antes de enviá-lo.",
    ],
    specifications: [
      { label: "Entrada", value: "Uma ou várias imagens JPG, PNG ou WebP." },
      { label: "Saída", value: "PDF em páginas A4, com uma imagem centralizada em cada página." },
      { label: "Enquadramento", value: "A proporção é preservada e a imagem é reduzida para caber integralmente na página." },
      { label: "Transparência", value: "Áreas transparentes recebem fundo branco na conversão para a página do PDF." },
    ],
    privacy: "As imagens são abertas, convertidas e adicionadas ao PDF dentro do navegador. Os arquivos não precisam ser transferidos ao Kivai. Como várias imagens podem ocupar muita memória ao mesmo tempo, seleções extensas funcionam melhor em computadores com recursos disponíveis.",
    limitations: [
      "A versão atual utiliza páginas A4 e não oferece escolha de tamanho, margens ou orientação por imagem.",
      "O texto presente nas fotografias permanece como imagem e não se torna selecionável ou pesquisável.",
      "Arquivos com transparência são compostos sobre fundo branco.",
      "Muitas fotografias em alta resolução podem produzir um PDF grande e exigir mais memória para gerar.",
    ],
    faqs: [
      { question: "Quantas imagens posso adicionar?", answer: "Não há um número fixo definido pela interface, mas o limite prático depende da memória do dispositivo e do tamanho total dos arquivos." },
      { question: "A ordem das imagens é preservada?", answer: "Sim. O PDF segue a ordem recebida na seleção. Confira a lista antes de gerar o documento." },
      { question: "As imagens são cortadas?", answer: "Não intencionalmente. Elas são dimensionadas proporcionalmente para caber na área da página A4." },
      { question: "O PDF terá texto pesquisável?", answer: "Não. Cada página contém uma imagem. Seria necessário OCR para transformar texto fotografado em conteúdo pesquisável." },
      { question: "Meus arquivos são enviados ao Kivai?", answer: "Não. A montagem do PDF ocorre localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/pdf-para-imagens", label: "PDF para imagens" },
      { href: "/ferramentas/unir-pdfs", label: "Unir PDFs" },
      { href: "/ferramentas/montar-pdf-para-impressao", label: "Montar PDF para impressão" },
    ],
  },
  "unir-pdfs": {
    overview: [
      "Unir PDFs combina dois ou mais documentos em um único arquivo, copiando as páginas na sequência definida pelo usuário. Antes da união, a lista informa nome, tamanho e quantidade de páginas e permite mover documentos para cima ou para baixo.",
      "A operação preserva as páginas existentes em vez de convertê-las em imagens. Isso tende a manter textos, gráficos e qualidade visual, embora recursos avançados como formulários, assinaturas digitais, marcadores e anexos possam sofrer alterações quando documentos independentes são reconstruídos em um novo PDF.",
    ],
    useCases: [
      { title: "Dossiês e processos", description: "Reúna capa, formulários, comprovantes e anexos em uma sequência única para protocolo." },
      { title: "Relatórios", description: "Combine capítulos ou documentos produzidos por áreas diferentes antes da distribuição." },
      { title: "Materiais de estudo", description: "Organize apostilas e exercícios em um arquivo contínuo na ordem desejada." },
      { title: "Arquivamento", description: "Consolide documentos relacionados, mantendo os originais separados como cópia de segurança." },
    ],
    steps: [
      "Selecione pelo menos dois arquivos PDF que possam ser abertos sem senha.",
      "Confira a contagem de páginas e remova arquivos adicionados por engano.",
      "Use os controles de ordem para definir a sequência final dos documentos.",
      "Inicie a união, baixe o PDF produzido e verifique as transições entre arquivos.",
    ],
    specifications: [
      { label: "Entrada", value: "Dois ou mais arquivos PDF compatíveis e sem proteção que impeça a leitura." },
      { label: "Saída", value: "Um PDF chamado pdf-unido.pdf com todas as páginas copiadas em sequência." },
      { label: "Organização", value: "Reordenação de documentos completos antes do processamento." },
      { label: "Qualidade", value: "As páginas são copiadas; não há rasterização deliberada durante a união." },
    ],
    privacy: "Os PDFs são lidos e combinados com a biblioteca PDF no navegador. O conteúdo não precisa ser enviado ao Kivai. O arquivo final é criado temporariamente na memória e baixado diretamente no dispositivo.",
    limitations: [
      "A ferramenta reorganiza documentos inteiros, não páginas individuais dentro de cada arquivo.",
      "PDFs protegidos, corrompidos ou com estruturas não suportadas podem falhar na leitura.",
      "Assinaturas digitais existentes normalmente deixam de ser válidas quando o documento é modificado.",
      "Formulários, índices, marcadores e anexos incorporados devem ser conferidos no resultado final.",
    ],
    faqs: [
      { question: "Posso mudar a ordem antes de unir?", answer: "Sim. Use as setas da lista para posicionar cada documento na sequência desejada." },
      { question: "A qualidade das páginas diminui?", answer: "As páginas são copiadas para o novo PDF, sem conversão proposital para imagem. Mesmo assim, recursos avançados devem ser revisados." },
      { question: "PDF com senha funciona?", answer: "Não quando a proteção impede a biblioteca de abrir ou copiar as páginas. Remova a senha com autorização antes de usar." },
      { question: "A assinatura digital continua válida?", answer: "Em geral, não. Unir arquivos modifica a estrutura e pode invalidar assinaturas criptográficas existentes." },
      { question: "Os documentos são enviados para um servidor?", answer: "Não. A união acontece localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/imagens-para-pdf", label: "Imagens para PDF" },
      { href: "/ferramentas/girar-pdf", label: "Girar PDF" },
    ],
  },
  "dividir-pdf": {
    overview: [
      "Dividir PDF separa todas as páginas de um documento em arquivos PDF individuais. Depois da leitura, a ferramenta cria um novo PDF para cada página e reúne os resultados em um pacote ZIP, evitando vários downloads manuais.",
      "A divisão é indicada quando páginas precisam seguir destinos diferentes ou quando apenas partes de um documento serão arquivadas. O processo copia cada página para uma nova estrutura. O original não é alterado e deve ser preservado, especialmente quando contém assinaturas, formulários ou uma organização que será perdida nos arquivos separados.",
    ],
    useCases: [
      { title: "Comprovantes", description: "Separe recibos, certificados ou fichas que foram digitalizados em um único documento." },
      { title: "Distribuição", description: "Crie arquivos individuais quando cada página precisa ser enviada a uma pessoa ou sistema diferente." },
      { title: "Seleção posterior", description: "Extraia todas as páginas para depois manter somente as necessárias em outro fluxo." },
      { title: "Arquivamento por item", description: "Transforme um lote consolidado em documentos unitários com nomes numerados." },
    ],
    steps: [
      "Selecione um arquivo PDF acessível e aguarde a identificação das páginas.",
      "Confira o nome, o tamanho e a quantidade total apresentada.",
      "Solicite a divisão; cada página será copiada para um PDF independente.",
      "Baixe o ZIP, extraia o conteúdo e confira os arquivos numerados.",
    ],
    specifications: [
      { label: "Entrada", value: "Um PDF sem senha que impeça a leitura." },
      { label: "Saída", value: "Pacote ZIP contendo um PDF separado para cada página." },
      { label: "Nomenclatura", value: "Arquivos numerados de acordo com a posição original das páginas." },
      { label: "Seleção", value: "A versão atual divide todas as páginas; não há campo para intervalo específico." },
    ],
    privacy: "A leitura, a cópia das páginas e a criação do ZIP acontecem no navegador. O PDF não precisa ser enviado ao Kivai. O pacote só é salvo quando o usuário inicia o download.",
    limitations: [
      "A ferramenta divide todas as páginas, sem escolher intervalos ou grupos personalizados nesta versão.",
      "Marcadores, navegação entre páginas e estrutura global do documento não acompanham cada arquivo isolado.",
      "Assinaturas digitais podem perder validade porque novas estruturas de PDF são geradas.",
      "Documentos longos podem consumir memória e produzir um ZIP com muitos arquivos.",
    ],
    faqs: [
      { question: "Receberei um arquivo por página?", answer: "Sim. Cada página se torna um PDF independente e todos são agrupados em um arquivo ZIP." },
      { question: "Posso escolher somente algumas páginas?", answer: "Não nesta versão. A operação atual separa todas as páginas do documento." },
      { question: "O PDF original é apagado?", answer: "Não. Ele é apenas lido e permanece no dispositivo sem alterações." },
      { question: "Por que o download é um ZIP?", answer: "O pacote permite entregar todos os PDFs individuais em um único download organizado." },
      { question: "O arquivo é processado localmente?", answer: "Sim. A divisão e o empacotamento ocorrem no navegador." },
    ],
    related: [
      { href: "/ferramentas/unir-pdfs", label: "Unir PDFs" },
      { href: "/ferramentas/pdf-para-imagens", label: "PDF para imagens" },
      { href: "/ferramentas/girar-pdf", label: "Girar PDF" },
    ],
  },
  "girar-pdf": {
    overview: [
      "Girar PDF altera a rotação de todas as páginas em 90, 180 ou 270 graus e cria uma nova cópia do documento. É útil quando uma digitalização foi salva de lado ou de cabeça para baixo e a orientação precisa ser corrigida de forma uniforme.",
      "A rotação é aplicada à configuração das páginas, sem transformar deliberadamente o conteúdo em imagem. Como o mesmo ângulo é usado no documento inteiro, arquivos que misturam páginas corretas e incorretas devem ser revisados antes: a versão atual não permite escolher páginas isoladas.",
    ],
    useCases: [
      { title: "Digitalizações", description: "Corrija lotes capturados com o alimentador ou o aparelho na orientação errada." },
      { title: "Leitura em tela", description: "Ajuste documentos que exigem rotação manual toda vez que são abertos." },
      { title: "Preparação para impressão", description: "Uniformize a orientação antes de montar ou imprimir um arquivo." },
      { title: "Arquivamento", description: "Crie uma cópia corrigida e mantenha o original separado para referência." },
    ],
    steps: [
      "Selecione um PDF que possa ser aberto sem senha.",
      "Confira a quantidade de páginas e o tamanho informado.",
      "Escolha rotação de 90, 180 ou 270 graus para todas as páginas.",
      "Gere, baixe a nova cópia e revise a orientação do documento completo.",
    ],
    specifications: [
      { label: "Entrada", value: "Um arquivo PDF compatível e acessível." },
      { label: "Ângulos", value: "90°, 180° ou 270° aplicados a todas as páginas." },
      { label: "Saída", value: "Novo PDF com sufixo -girado no nome do arquivo." },
      { label: "Conteúdo", value: "A rotação da página muda, sem rasterização intencional do texto e dos gráficos." },
    ],
    privacy: "O documento é carregado e modificado pela biblioteca PDF no navegador. Não é necessário enviar o arquivo ao Kivai. A cópia girada é criada temporariamente e disponibilizada para download no próprio dispositivo.",
    limitations: [
      "O mesmo ângulo é aplicado a todas as páginas; não há seleção individual nesta versão.",
      "A ferramenta não corrige inclinação de poucos graus nem perspectiva de uma digitalização.",
      "Assinaturas digitais podem ser invalidadas quando qualquer modificação é salva no PDF.",
      "Arquivos protegidos ou danificados podem não ser carregados corretamente.",
    ],
    faqs: [
      { question: "Posso girar somente uma página?", answer: "Não nesta versão. O ângulo selecionado é aplicado ao documento inteiro." },
      { question: "A rotação reduz a qualidade?", answer: "Não há conversão proposital para imagem. A ferramenta altera a rotação das páginas e salva uma nova estrutura PDF." },
      { question: "Qual ângulo corrige uma página de cabeça para baixo?", answer: "Normalmente 180 graus. Use 90 ou 270 graus para páginas que aparecem de lado." },
      { question: "O original é substituído?", answer: "Não. Uma nova cópia com sufixo -girado é baixada." },
      { question: "O PDF é enviado ao servidor?", answer: "Não. A operação acontece localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/montar-pdf-para-impressao", label: "Montar para impressão" },
    ],
  },
  "compactar-pdf": {
    overview: [
      "Compactar PDF oferece três estratégias. A baixa compressão reorganiza a estrutura preservando texto, vetores e links, mas pode reduzir pouco. As opções média e alta renderizam cada página como imagem JPEG, descartando estruturas interativas para tentar diminuir o arquivo.",
      "A escolha depende do uso. Documentos que precisam continuar pesquisáveis, acessíveis ou assináveis devem permanecer no modo de baixa compressão. Para cópias visuais destinadas somente a leitura, os modos rasterizados podem gerar maior economia, especialmente quando o PDF original contém imagens pesadas. O tamanho final nunca é garantido e deve ser comparado com o original.",
    ],
    useCases: [
      { title: "Anexos com limite", description: "Tente reduzir uma cópia para envio por e-mail ou formulário, conferindo se o resultado atende ao limite exigido." },
      { title: "Cópia visual", description: "Gere uma versão rasterizada para consulta quando seleção de texto, formulários e links não forem necessários." },
      { title: "Otimização estrutural", description: "Regrave o PDF com object streams mantendo sua natureza documental, aceitando que a redução possa ser mínima." },
      { title: "Distribuição", description: "Prepare uma versão secundária mais leve e preserve o original para edição, assinatura e arquivo." },
    ],
    steps: [
      "Selecione um PDF sem senha e confira tamanho e quantidade de páginas.",
      "Escolha baixa compressão para preservar recursos ou média/alta para gerar uma cópia visual rasterizada.",
      "Inicie o processo e aguarde a reconstrução de todas as páginas.",
      "Baixe o resultado, compare o tamanho e revise legibilidade, links e recursos necessários.",
    ],
    specifications: [
      { label: "Baixa compressão", value: "Reorganiza objetos e preserva texto, vetores e links; pode não diminuir o arquivo." },
      { label: "Compressão média", value: "Rasteriza páginas em resolução equilibrada e JPEG de qualidade intermediária." },
      { label: "Alta compressão", value: "Rasteriza em resolução e qualidade menores para priorizar economia de espaço." },
      { label: "Saída", value: "Nova cópia PDF; o resultado deve ser comparado porque alguns arquivos podem ficar iguais ou maiores." },
    ],
    privacy: "O PDF é aberto e reconstruído no navegador. No modo rasterizado, cada página é renderizada localmente antes de ser inserida no novo documento. O conteúdo não precisa ser enviado ao Kivai, mas arquivos extensos podem exigir bastante memória e tempo de processamento.",
    limitations: [
      "Nenhum nível garante redução: PDFs já otimizados podem manter o tamanho ou até aumentar.",
      "Compressão média e alta eliminam texto selecionável, links, formulários, camadas e assinaturas digitais.",
      "A rasterização pode reduzir nitidez de letras pequenas, gráficos e imagens detalhadas.",
      "Documentos protegidos, corrompidos ou muito grandes podem falhar conforme os recursos do dispositivo.",
    ],
    faqs: [
      { question: "Qual modo preserva texto pesquisável?", answer: "Use baixa compressão. Os modos médio e alto convertem cada página em imagem e removem a estrutura textual." },
      { question: "Por que meu PDF não ficou menor?", answer: "Ele pode já estar otimizado ou conter dados que não diminuem com a estratégia escolhida. Compare os arquivos e mantenha o menor que preservar a qualidade necessária." },
      { question: "A assinatura digital será preservada?", answer: "Não conte com isso. Salvar qualquer versão modificada pode invalidar a assinatura, e os modos rasterizados a removem como recurso criptográfico." },
      { question: "A compressão alta serve para impressão?", answer: "Pode perder nitidez. Para impressão, prefira o original ou o modo de preservação e siga a resolução solicitada pelo fornecedor." },
      { question: "O documento é enviado ao Kivai?", answer: "Não. A otimização e a rasterização acontecem localmente no navegador." },
    ],
    related: [
      { href: "/ferramentas/redimensionar-pdf", label: "Redimensionar PDF" },
      { href: "/ferramentas/dividir-pdf", label: "Dividir PDF" },
      { href: "/ferramentas/pdf-para-imagens", label: "PDF para imagens" },
    ],
  },
} satisfies Record<PdfToolEditorialSlug, PdfToolEditorialContent>;
