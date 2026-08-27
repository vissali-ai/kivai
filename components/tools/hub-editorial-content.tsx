type HubKey =
  | "imagens"
  | "pdfs"
  | "calculadoras"
  | "texto"
  | "social-media"
  | "videos";

type HubContent = {
  eyebrow: string;
  title: string;
  introduction: string[];
  guides: Array<{ title: string; text: string }>;
  workflowTitle: string;
  workflow: string[];
  noteTitle: string;
  note: string;
};

const hubContent: Record<HubKey, HubContent> = {
  imagens: {
    eyebrow: "Guia de imagens digitais",
    title: "Escolha a ferramenta de acordo com o resultado que a imagem precisa entregar",
    introduction: [
      "Imagens digitais podem exigir ajustes diferentes antes de serem publicadas, enviadas ou reutilizadas. Converter muda o formato; comprimir reduz o peso do arquivo; redimensionar altera largura e altura; recortar redefine o enquadramento; girar ou espelhar corrige a orientação. Outras operações resolvem necessidades específicas, como remover o fundo, aplicar marca-d'água, criar favicons, gerar placeholders ou retirar metadados incorporados ao arquivo.",
      "A escolha do formato também interfere no resultado. JPG costuma funcionar bem para fotografias; PNG é útil quando transparência ou elementos gráficos precisam ser preservados; WebP pode reduzir o tamanho de imagens destinadas à web. Arquivos HEIC e SVG podem exigir conversão conforme o sistema, navegador ou plataforma de destino. Sempre que possível, preserve uma cópia do arquivo original antes das alterações.",
    ],
    guides: [
      { title: "Para sites e e-commerce", text: "Ajuste as dimensões para o espaço real de exibição, comprima sem comprometer a leitura visual e escolha um formato adequado ao canal. Remoção de fundo, placeholders e favicons também ajudam a preparar imagens para páginas, catálogos e lojas virtuais." },
      { title: "Para editar e padronizar", text: "Recorte, gire, espelhe, redimensione ou aplique marca-d'água conforme a finalidade. Quando a imagem fizer parte de um conjunto, mantenha proporções, enquadramento e padrão visual consistentes antes da exportação final." },
      { title: "Para converter e compartilhar", text: "Use a conversão quando o arquivo original não for aceito ou quando outro formato atender melhor ao uso pretendido. Antes do download final, confira transparência, nitidez, dimensões e possíveis diferenças de qualidade." },
    ],
    workflowTitle: "Fluxo recomendado para imagens de produto",
    workflow: [
      "Comece pela imagem original com a melhor resolução disponível e defina onde ela será utilizada.",
      "Ajuste fundo, enquadramento e orientação antes de reduzir as dimensões.",
      "Padronize tamanho e proporção de acordo com a loja, marketplace, site ou rede social de destino.",
      "Converta e comprima na etapa final, revise o resultado visual e remova metadados quando houver necessidade de reduzir informações incorporadas ao arquivo.",
    ],
    noteTitle: "Qualidade, original e privacidade",
    note: "Nem todas as operações usam necessariamente o mesmo tipo de processamento. Quando uma ferramenta informar que o processamento ocorre localmente, o arquivo permanece no dispositivo durante aquela tarefa. Para imagens com dados de localização ou outras informações incorporadas, o Removedor de Metadados pode gerar uma nova cópia sem esses registros quando presentes. Em qualquer fluxo, mantenha o original em local seguro e revise o arquivo gerado antes de substituir ou publicar a versão anterior.",
  },
  pdfs: {
    eyebrow: "Guia de documentos PDF",
    title: "Escolha entre converter, editar ou reorganizar o PDF",
    introduction: [
      "PDF foi criado para preservar a apresentação de um documento. Por isso, transformar seu conteúdo em Word, Excel ou PowerPoint exige operações diferentes de simplesmente unir, girar ou redimensionar páginas.",
      "Antes de escolher uma ferramenta, confirme se o PDF contém texto selecionável ou apenas imagens digitalizadas. Conversores sem OCR trabalham com o texto já existente no arquivo e não reconhecem automaticamente documentos escaneados.",
    ],
    guides: [
      { title: "Converter conteúdo", text: "Use PDF para Word quando precisar editar texto, PDF para Excel para recuperar tabelas e PDF para PowerPoint quando cada página puder funcionar como um slide visual." },
      { title: "Preparar para impressão", text: "Redimensionar troca o formato de cada página. Montar para impressão cria novas folhas e permite posicionar ou repetir o conteúdo, como etiquetas e cartões." },
      { title: "Organizar páginas", text: "Unir, dividir e girar preservam o documento em PDF. São indicados quando o conteúdo está correto e apenas a sequência ou orientação precisa mudar." },
    ],
    workflowTitle: "Antes de processar um documento",
    workflow: [
      "Faça uma cópia do PDF original.",
      "Confira proteção por senha, tamanho e quantidade de páginas.",
      "Escolha a ferramenta de acordo com o resultado final desejado.",
      "Abra o arquivo baixado e revise textos, tabelas, fontes e paginação.",
    ],
    noteTitle: "Documentos sensíveis",
    note: "As ferramentas destacadas informam quando o processamento ocorre localmente. Ainda assim, avalie a confidencialidade do documento, use um dispositivo confiável e remova arquivos baixados de computadores compartilhados.",
  },
  calculadoras: {
    eyebrow: "Guia de indicadores",
    title: "Use cada cálculo para responder uma pergunta diferente",
    introduction: [
      "Porcentagem, margem, markup, ROI e ROAS não são nomes diferentes para o mesmo resultado. Cada indicador utiliza uma base específica e responde a uma decisão distinta de preço, investimento ou desempenho de campanha.",
      "Uma calculadora reduz erros aritméticos, mas não substitui a qualidade dos dados informados. Custos ignorados, receitas atribuídas incorretamente e períodos diferentes podem produzir um número matematicamente correto e uma conclusão de negócio equivocada.",
    ],
    guides: [
      { title: "Preço e rentabilidade", text: "Markup ajuda a formar o preço a partir do custo. Margem mostra quanto da receita permanece após o custo considerado. Os percentuais não devem ser tratados como equivalentes." },
      { title: "Campanhas", text: "ROAS compara receita atribuída à publicidade com o investimento em mídia. Ele não inclui automaticamente impostos, produto, equipe, plataforma ou logística." },
      { title: "Investimento completo", text: "ROI relaciona ganho ou perda ao investimento total definido. Compare sempre resultados calculados para o mesmo intervalo de tempo e com critérios consistentes." },
    ],
    workflowTitle: "Como interpretar um resultado",
    workflow: [
      "Defina exatamente quais valores entram no cálculo.",
      "Use números do mesmo período e da mesma operação.",
      "Confira a fórmula e a unidade apresentada.",
      "Analise o indicador junto com custos, riscos e capacidade operacional.",
    ],
    noteTitle: "Resultados são estimativas",
    note: "As calculadoras têm finalidade informativa e educacional. Decisões financeiras, fiscais ou contábeis devem considerar dados completos e, quando necessário, orientação profissional qualificada.",
  },
  texto: {
    eyebrow: "Guia de análise textual",
    title: "Contagem ajuda a revisar; contexto define a qualidade",
    introduction: [
      "Métricas de texto são úteis para respeitar limites, estimar tempo de leitura e identificar repetições, mas não medem clareza, precisão ou utilidade. Um texto curto pode estar completo; um texto longo pode repetir ideias sem acrescentar informação.",
      "A contagem também varia conforme a regra utilizada. Espaços, emojis, pontuação, quebras de linha e caracteres combinados podem ser interpretados de maneiras diferentes por editores e plataformas.",
    ],
    guides: [
      { title: "Palavras e caracteres", text: "Use palavras para estimar extensão e leitura. Use caracteres quando o canal impuser um limite técnico, observando se ele considera ou não espaços." },
      { title: "Tempo de leitura", text: "A estimativa parte de uma velocidade média. Termos técnicos, listas, tabelas e o nível de familiaridade do leitor podem alterar bastante o tempo real." },
      { title: "Revisão final", text: "Depois de ajustar o tamanho, revise coerência, fontes, ortografia e chamadas para ação. Não remova informações essenciais apenas para atingir um número." },
    ],
    workflowTitle: "Uma revisão textual prática",
    workflow: [
      "Escreva a primeira versão pensando na mensagem.",
      "Meça palavras, caracteres e tempo estimado.",
      "Corte redundâncias e esclareça trechos ambíguos.",
      "Leia novamente no contexto em que o texto será publicado.",
    ],
    noteTitle: "Dados digitados",
    note: "Para textos confidenciais, prefira ferramentas que façam a análise localmente e evite colar senhas, dados bancários, documentos pessoais ou informações que não sejam necessárias para a tarefa.",
  },
  "social-media": {
    eyebrow: "Guia para publicações sociais",
    title: "Prepare a legenda para a plataforma e para quem vai ler",
    introduction: [
      "Formatação, quantidade de hashtags e limite de caracteres afetam a publicação, mas não garantem alcance. O conteúdo precisa continuar compreensível fora das métricas e respeitar o contexto, o público e as regras atuais da plataforma escolhida.",
      "Limites de redes sociais podem mudar. Use os contadores como apoio durante a edição e confira as informações exibidas pelo próprio aplicativo antes de publicar campanhas importantes.",
    ],
    guides: [
      { title: "Legenda", text: "Apresente a informação principal cedo, divida blocos longos e mantenha chamadas para ação coerentes com o conteúdo. Quebras de linha devem melhorar a leitura, não esconder informação." },
      { title: "Hashtags", text: "Prefira termos realmente relacionados à publicação. Repetir listas genéricas em todo conteúdo pode reduzir relevância e dificultar a leitura." },
      { title: "Acessibilidade", text: "Use linguagem clara, descreva elementos visuais importantes e evite sequências excessivas de emojis ou caracteres decorativos que prejudiquem leitores de tela." },
    ],
    workflowTitle: "Antes de publicar",
    workflow: [
      "Escreva a mensagem completa e identifique o objetivo.",
      "Organize parágrafos, chamada para ação e hashtags.",
      "Confira caracteres e visualização em tela pequena.",
      "Faça uma revisão humana de tom, links e informações factuais.",
    ],
    noteTitle: "Sem promessa de desempenho",
    note: "As ferramentas auxiliam na preparação técnica do texto. Alcance, engajamento e distribuição dependem de fatores externos e não podem ser garantidos por contagem de caracteres, formatação ou hashtags.",
  },
  videos: {
    eyebrow: "Guia de processamento de vídeo",
    title: "Escolha a operação de acordo com o destino e a condição do vídeo",
    introduction: [
      "Trabalhar com vídeo envolve mais do que cortar um trecho ou trocar a extensão do arquivo. Conversão pode melhorar compatibilidade entre formatos e codecs; compressão reduz o tamanho; redimensionamento altera a resolução; recorte muda a área visível; divisão separa partes; rotação e espelhamento corrigem orientação; ajustes de velocidade e volume modificam a reprodução. Também é possível capturar frames, remover a faixa sonora ou extrair o áudio para outro uso.",
      "O resultado depende do arquivo de origem, do codec, do navegador e da capacidade do dispositivo. Dois vídeos com a mesma extensão podem usar codificações diferentes e exigir tratamentos distintos. Formatos como MP4, MOV, AVI e HEVC atendem a necessidades diferentes, por isso a conversão deve ser escolhida pelo destino do arquivo e não apenas pelo nome da extensão.",
    ],
    guides: [
      { title: "Para editar e preparar", text: "Defina primeiro duração, enquadramento, orientação e dimensões. Depois ajuste velocidade, volume ou remova o áudio quando necessário. Fazer alterações estruturais antes da compressão evita repetir etapas e reduz perdas acumuladas de qualidade." },
      { title: "Para converter e compartilhar", text: "Use conversores quando o formato ou codec original dificultar reprodução, edição ou envio. HEVC pode reduzir tamanho com boa eficiência, enquanto MP4 costuma ter ampla compatibilidade, mas o suporte final depende do codec, do navegador e do aplicativo de destino." },
      { title: "Para reduzir tamanho e extrair conteúdo", text: "A compressão pode diminuir o peso do vídeo alterando qualidade, resolução ou codificação. Quando apenas uma imagem ou o som forem necessários, capture um frame ou extraia o áudio em vez de manter todo o arquivo de vídeo." },
    ],
    workflowTitle: "Fluxo recomendado para editar e exportar vídeos",
    workflow: [
      "Guarde o arquivo original e defina onde o vídeo será reproduzido, publicado ou enviado.",
      "Faça cortes, divisão, recorte de área, rotação ou espelhamento antes das etapas de redução e conversão final.",
      "Ajuste dimensões, velocidade e áudio de acordo com o objetivo e com as limitações do canal de destino.",
      "Converta ou comprima na etapa final, assista ao arquivo exportado por completo e confira imagem, áudio, duração, sincronização e tamanho.",
    ],
    noteTitle: "Compatibilidade, desempenho e uso responsável",
    note: "Ferramentas de vídeo podem processar arquivos de formas diferentes. Quando a página informar processamento local, o trabalho ocorre no dispositivo e utiliza memória e capacidade de processamento do navegador. Arquivos grandes, codecs pouco suportados ou dispositivos com poucos recursos podem causar lentidão ou falhas. Em ferramentas de download, utilize apenas mídias públicas que possam ser baixadas de forma autorizada e respeite direitos autorais, privacidade e regras da plataforma de origem.",
  },
};

export async function HubEditorialContent({ hub }: { hub: HubKey }) {
  const managedHub = await getSiteHubBySlug(hub, true);
  if (managedHub?.contentHtml) return <section className="border-t border-border bg-muted/10 py-14 sm:py-18"><article className="cms-public-content mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" dangerouslySetInnerHTML={{ __html: managedHub.contentHtml }} /></section>;
  const content = hubContent[hub];

  return (
    <section
      aria-labelledby={`${hub}-editorial-title`}
      className="border-t border-border bg-muted/10 py-14 sm:py-18"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          {content.eyebrow}
        </p>
        <h2
          id={`${hub}-editorial-title`}
          className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight"
        >
          {content.title}
        </h2>

        <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
          {content.introduction.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {content.guides.map((guide) => (
            <article key={guide.title} className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">{guide.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{content.workflowTitle}</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              {content.workflow.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{content.noteTitle}</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{content.note}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
import { getSiteHubBySlug } from "@/lib/site-cms/repository";
