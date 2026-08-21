import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { removedorMetadadosTool } from "@/lib/removedor-metadados-tool";
import { buildToolPageSchema } from "@/lib/tool-page-schema";

const slug = removedorMetadadosTool.slug;
const name = removedorMetadadosTool.name;

const content = {
  overview: [
    "Imagens podem carregar informações incorporadas além dos pixels visíveis. Dependendo do arquivo e do dispositivo que o criou, esses dados podem incluir modelo da câmera, data, coordenadas de localização, software utilizado e outros campos técnicos.",
    "O Removedor de Metadados do Kivai recria a imagem a partir dos pixels decodificados e gera um novo arquivo no mesmo formato. Dessa forma, os blocos de metadados herdados do original, como EXIF, GPS, XMP e IPTC quando presentes, não são copiados para a nova imagem.",
  ],
  useCases: [
    { title: "Compartilhar fotos com mais privacidade", description: "Crie uma nova cópia antes de enviar fotografias que possam conter localização, data ou dados do dispositivo." },
    { title: "Publicação em sites e redes sociais", description: "Prepare uma versão limpa de JPG, PNG ou WebP antes de publicar ou reutilizar a imagem em outros canais." },
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
    { label: "Processamento", value: "Decodificação e nova codificação executadas localmente no navegador." },
  ],
  privacy: "O arquivo selecionado é processado localmente. Ele não precisa ser enviado ao servidor do Kivai para que a nova cópia seja gerada. O nome do download também é substituído por um nome neutro para não repetir o nome original do arquivo.",
  limitations: [
    "A ferramenta remove os metadados herdados do arquivo original, mas o navegador pode inserir informações técnicas próprias mínimas no arquivo exportado, como parâmetros de codificação ou resolução padrão.",
    "JPG e WebP usam compressão com perdas; recriar o arquivo pode produzir pequena diferença de tamanho ou qualidade mesmo mantendo as dimensões.",
    "A ferramenta não detecta nem remove informações visualmente presentes nos pixels, como placas, textos, rostos, marcas d'água ou localização visível na própria foto.",
    "Ela também não é uma ferramenta de detecção de esteganografia ou de limpeza de registros externos mantidos por aplicativos, sistemas operacionais ou plataformas onde a imagem já tenha sido enviada.",
  ],
  faqs: [
    { question: "A ferramenta remove localização GPS da foto?", answer: "Quando as coordenadas estiverem armazenadas como metadados incorporados no arquivo original, elas não são copiadas para a nova imagem gerada pelo Kivai." },
    { question: "Ela remove EXIF, XMP e IPTC?", answer: "A nova imagem é criada a partir dos pixels, sem reutilizar os blocos de metadados do arquivo original. Isso elimina os metadados herdados desses blocos quando presentes." },
    { question: "A imagem fica idêntica?", answer: "As dimensões são preservadas. PNG é exportado sem perda visual por compressão; JPG e WebP podem sofrer pequena recompressão porque precisam ser codificados novamente." },
    { question: "A ferramenta garante que não exista nenhum dado além dos pixels?", answer: "Não é correto prometer isso. O navegador pode adicionar metadados técnicos próprios mínimos ao arquivo novo. O objetivo é não carregar os metadados herdados da imagem original." },
    { question: "A imagem é enviada para o Kivai?", answer: "Não durante a operação normal desta ferramenta. A leitura, a recriação e o download acontecem localmente no navegador." },
  ],
  related: [
    { href: "/ferramentas/compressor-de-imagens", label: "Compressor de Imagens" },
    { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar Imagem" },
    { href: "/ferramentas/conversor-de-imagens", label: "Conversor de Imagens" },
  ],
};

export function RemovedorMetadadosEditorial() {
  const schema = buildToolPageSchema({
    name,
    slug,
    description: removedorMetadadosTool.seoDescription,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Imagens", href: "/ferramentas/imagens" },
      { name, href: removedorMetadadosTool.href },
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
        overview={content.overview}
        useCases={content.useCases}
        steps={content.steps}
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={content.related}
        afterFaq={<AdSlot placement="tool-bottom" variant="banner" />}
      />
    </>
  );
}
