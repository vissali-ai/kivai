import type { VideoLocalEditorialContent } from "@/lib/video-local-tool-editorial-content";

export const doubleVideoEditorial: VideoLocalEditorialContent = {
  overview: ["Junte gratuitamente dois vídeos gravados no mesmo ambiente e momento, mesmo que tenham sido feitos em celulares diferentes. A ferramenta analisa o áudio em comum para sincronizar as gravações automaticamente e cria uma composição de câmera dupla no navegador, sem enviar os arquivos ao Kivai."],
  useCases: [
    { title: "Juntar gravações do mesmo momento", description: "Combine vídeos de duas pessoas que filmaram o mesmo acontecimento de ângulos diferentes." },
    { title: "Sincronizar duas câmeras", description: "Alinhe o áudio captado pelos celulares e mostre a cena em tela dividida ou câmera dupla." },
    { title: "Vídeo de reação ou entrevista", description: "Use o vídeo principal com áudio original e coloque a reação ou segunda perspectiva em uma janela menor." },
  ],
  steps: ["Envie o vídeo principal e a gravação da segunda câmera.", "Depois que os dois vídeos carregarem, aguarde a análise automática do áudio em comum.", "Se a ferramenta não encontrar um trecho de áudio confiável, ajuste manualmente a sincronização pelo controle deslizante.", "Escolha câmera sobreposta ou tela dividida e confira a prévia.", "O áudio do vídeo principal será mantido; gere e baixe o vídeo final gratuitamente."],
  specifications: [
    { label: "Sincronização", value: "Amostras de áudio em comum são comparadas localmente após o carregamento; há ajuste manual quando necessário." },
    { label: "Composições", value: "Imagem sobreposta com opções de forma e posição ou tela dividida horizontal/vertical." },
    { label: "Áudio", value: "A faixa do vídeo principal é a faixa sonora do resultado. O áudio da segunda câmera não é misturado." },
    { label: "Saída", value: "Um arquivo WebM ou MP4, conforme os formatos de gravação compatíveis com o navegador." },
  ],
  privacy: "Os arquivos são lidos e processados localmente no navegador. Eles não são enviados ao Kivai. Mantenha a página aberta até concluir e baixar o vídeo.",
  limitations: ["A sincronização automática depende de os dois vídeos conterem áudio em comum e de o navegador conseguir decodificar essas faixas; se não for possível, use o ajuste manual.", "A ferramenta compara até três minutos de áudio de cada gravação para encontrar o trecho compartilhado.", "O resultado termina quando uma das gravações chega ao fim. O vídeo final segue o formato do vídeo principal.", "Exportar exige memória e processamento do dispositivo. Arquivos longos ou grandes podem demorar ou exceder os recursos do celular."],
  faqs: [
    { question: "A ferramenta sincroniza vídeos gravados em celulares diferentes?", answer: "Sim. Depois que os dois arquivos carregam, ela compara trechos de áudio em comum para alinhar o mesmo momento. Se não encontrar uma correspondência confiável, você pode ajustar o início manualmente." },
    { question: "O que acontece com o áudio dos dois vídeos?", answer: "O áudio do vídeo principal é mantido como som do resultado. O áudio da segunda gravação é usado apenas para procurar a sincronização e não é misturado." },
    { question: "Preciso enviar os vídeos para um serviço pago?", answer: "Não. A ferramenta gratuita processa os arquivos no seu navegador e não envia os vídeos ao Kivai." },
    { question: "Quais layouts estão disponíveis?", answer: "Você pode sobrepor o segundo vídeo com diferentes formas ou dividir a tela horizontal ou verticalmente." },
    { question: "Meus vídeos são enviados para um servidor?", answer: "Não. A prévia e a composição são processadas no seu navegador." },
    { question: "Em qual formato posso baixar?", answer: "A ferramenta escolhe WebM ou MP4 de acordo com os formatos de gravação disponíveis no navegador." },
  ],
  related: [
    { href: "/ferramentas/recortar-video", label: "Recortar vídeo" },
    { href: "/ferramentas/redimensionar-video", label: "Redimensionar vídeo" },
    { href: "/ferramentas/compressor-de-videos", label: "Compressor de vídeos" },
  ],
};

