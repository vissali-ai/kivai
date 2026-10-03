export const removedorMetadadosEditorialContent = {
  overview: [
    "Imagens podem carregar informações incorporadas além dos pixels visíveis. Dependendo do arquivo e do dispositivo que o criou, esses dados podem incluir modelo da câmera, data, coordenadas de localização, software utilizado e outros campos técnicos.",
    "O Removedor de Metadados de IA do Kivai recria a imagem a partir dos pixels decodificados e gera um novo arquivo no mesmo formato. Dessa forma, blocos herdados como EXIF, GPS, XMP, IPTC e estruturas de procedência C2PA/Content Credentials, quando presentes, não são copiados para a nova imagem.",
    "Em imagens geradas por ferramentas como o ChatGPT, a remoção dessas credenciais pode fazer com que um rótulo de IA deixe de aparecer quando a plataforma estiver usando esses metadados como sinal. O resultado pode variar, porque alguns sistemas também utilizam sinais incorporados ao próprio conteúdo.",
  ],
  useCases: [
    { title: "Compartilhar fotos com mais privacidade", description: "Crie uma nova cópia antes de enviar fotografias que possam conter localização, data ou dados do dispositivo." },
    { title: "Imagens geradas por IA", description: "Limpe metadados e credenciais de procedência de imagens criadas em ferramentas como o ChatGPT antes de reutilizá-las em outros canais." },
    { title: "Publicação em sites e redes sociais", description: "Prepare uma versão limpa de JPG, PNG ou WebP. Quando um rótulo de IA depender dos metadados removidos, ele pode deixar de ser exibido pela plataforma." },
    { title: "Arquivos recebidos de terceiros", description: "Recrie a imagem quando você não quiser manter os metadados incorporados no arquivo recebido." },
    { title: "Padronização de ativos", description: "Gere cópias com nome neutro e sem reutilizar os blocos de metadados do arquivo de origem." },
  ],
  steps: [
    "Selecione ou arraste uma imagem JPG, PNG ou WebP.",
    "Confira a prévia, o formato, as dimensões e o tamanho do arquivo.",
    "Clique em Remover metadados para recriar a imagem a partir dos pixels.",
    "Baixe a nova cópia com nome neutro e formato preservado.",
  ],
  specifications: [
    { label: "Formatos aceitos", value: "JPG/JPEG, PNG e WebP." },
    { label: "Limite por arquivo", value: "Até 40 MB e até 40 megapixels nesta versão." },
    { label: "Formato de saída", value: "O mesmo formato da entrada: JPG, PNG ou WebP." },
    { label: "Dados verificados", value: "EXIF, GPS, XMP, IPTC, ICC, comentários e estruturas conhecidas de C2PA/Content Credentials." },
    { label: "Processamento", value: "Decodificação, nova codificação e verificação executadas localmente no navegador." },
  ],
  privacy: "O arquivo selecionado é processado localmente. Ele não precisa ser enviado ao servidor do Kivai para que a nova cópia seja gerada. O nome do download também é substituído por um nome neutro para não repetir o nome original do arquivo.",
  limitations: [
    "A ferramenta remove e verifica estruturas conhecidas de metadados e procedência do arquivo final. Ela não garante que uma plataforma deixará de classificar uma imagem como criada por IA, pois podem existir outros sinais além dos metadados.",
    "JPG e WebP usam compressão com perdas; recriar o arquivo pode produzir pequena diferença de tamanho ou qualidade mesmo mantendo as dimensões.",
    "A ferramenta não detecta nem remove informações visualmente presentes nos pixels, como placas, textos, rostos, marcas d'água ou localização visível na própria foto.",
    "Ela também não é uma ferramenta de detecção de esteganografia ou de limpeza de registros externos mantidos por aplicativos, sistemas operacionais ou plataformas onde a imagem já tenha sido enviada.",
  ],
  faqs: [
    { question: "A ferramenta remove localização GPS da foto?", answer: "Quando as coordenadas estiverem armazenadas como metadados incorporados no arquivo original, elas não são copiadas para a nova imagem gerada pelo Kivai." },
    { question: "Ela remove EXIF, XMP e IPTC?", answer: "A nova imagem é criada a partir dos pixels, sem reutilizar os blocos de metadados do arquivo original. Isso elimina os metadados herdados desses blocos quando presentes." },
    { question: "A imagem fica idêntica?", answer: "As dimensões são preservadas. PNG é exportado sem perda visual por compressão; JPG e WebP podem sofrer pequena recompressão porque precisam ser codificados novamente." },
    { question: "Remove metadados de imagens criadas no ChatGPT?", answer: "Sim. Quando presentes no arquivo, estruturas como C2PA/Content Credentials, além de EXIF, XMP, IPTC e outros blocos conhecidos, são descartadas na recriação e verificadas antes do download." },
    { question: "Pode remover o rótulo de IA de uma imagem do ChatGPT?", answer: "Pode, quando o rótulo estiver sendo acionado pelos metadados ou credenciais de procedência removidos. Isso não é uma garantia universal, porque plataformas e ferramentas também podem usar outros sinais para identificar a origem do conteúdo." },
    { question: "A ferramenta garante que não exista nenhum dado além dos pixels?", answer: "Ela verifica os principais blocos estruturais conhecidos depois da recriação. Ainda assim, não é correto prometer ausência absoluta de qualquer sinal possível, especialmente sinais incorporados ao próprio conteúdo visual." },
    { question: "A imagem é enviada para o Kivai?", answer: "Não durante a operação normal desta ferramenta. A leitura, a recriação e o download acontecem localmente no navegador." },
  ],
  related: [
    { href: "/ferramentas/compressor-de-imagens", label: "Compressor de Imagens" },
    { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar Imagem" },
    { href: "/ferramentas/conversor-de-imagens", label: "Conversor de Imagens" },
  ],
};
