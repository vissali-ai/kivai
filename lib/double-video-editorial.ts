import type { VideoLocalEditorialContent } from "@/lib/video-local-tool-editorial-content";

export const doubleVideoEditorial: VideoLocalEditorialContent = {
  overview: ["Combine duas gravações em um único vídeo para mostrar a cena e uma reação, entrevista ou segunda perspectiva. A montagem acontece no navegador, sem enviar os arquivos ao Kivai."],
  useCases: [
    { title: "Vídeo de reação", description: "Mostre a gravação principal e sua reação em uma janela menor." },
    { title: "Duas perspectivas", description: "Exiba dois ângulos lado a lado em uma composição única." },
  ],
  steps: ["Envie o vídeo principal e o vídeo que ficará sobreposto ou ao lado.", "Escolha imagem sobreposta ou tela dividida.", "Na imagem sobreposta, escolha o canto e ajuste o tamanho da janela.", "Confira a prévia sincronizada e clique em Gerar vídeo.", "Reproduza o resultado e baixe o arquivo no formato indicado pela ferramenta."],
  specifications: [
    { label: "Composições", value: "Imagem sobreposta em quatro posições ou tela dividida horizontal/vertical." },
    { label: "Prévia", value: "Os dois vídeos são reproduzidos em conjunto para conferir a composição antes de exportar." },
    { label: "Saída", value: "Um arquivo WebM ou MP4, conforme os formatos de gravação compatíveis com o navegador." },
  ],
  privacy: "Os arquivos são lidos e processados localmente no navegador. Eles não são enviados ao Kivai. Mantenha a página aberta até concluir e baixar o vídeo.",
  limitations: ["Use vídeos em formatos que o navegador consiga reproduzir; a exportação pode ser WebM ou MP4 conforme o navegador.", "O vídeo final usa a duração do vídeo principal; o segundo vídeo para quando sua reprodução termina.", "Exportar exige memória e processamento do dispositivo. Arquivos longos ou grandes podem demorar ou exceder os recursos do celular."],
  faqs: [
    { question: "Preciso gravar os dois vídeos ao mesmo tempo?", answer: "Não. Envie duas gravações existentes para montar a composição." },
    { question: "Quais layouts estão disponíveis?", answer: "Você pode colocar um vídeo sobre o outro em um canto ou dividir a tela horizontal ou verticalmente." },
    { question: "Meus vídeos são enviados para um servidor?", answer: "Não. A prévia e a composição são processadas no seu navegador." },
    { question: "Em qual formato posso baixar?", answer: "A ferramenta escolhe WebM ou MP4 de acordo com os formatos de gravação disponíveis no navegador." },
  ],
  related: [
    { href: "/ferramentas/recortar-video", label: "Recortar vídeo" },
    { href: "/ferramentas/redimensionar-video", label: "Redimensionar vídeo" },
    { href: "/ferramentas/compressor-de-videos", label: "Compressor de vídeos" },
  ],
};

