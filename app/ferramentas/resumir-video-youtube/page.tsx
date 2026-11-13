import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { getToolMetadataAsync } from "@/lib/seo";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import VideoSummaryClient from "../transcrever-resumir-video/preview-client";

const slug="resumir-video-youtube";
const description="Resuma vídeos públicos do YouTube, leia as ideias principais, gere áudio do resumo e organize seus estudos em playlists.";
const faqs=[
 {question:"Como resumir um vídeo do YouTube?",answer:"Cole o link público do YouTube, clique em Gerar resumo inteligente e leia o resultado. Depois, você pode ouvir a narração ou salvar o conteúdo."},
 {question:"Posso ouvir o resumo em áudio?",answer:"Sim. Depois que o resumo estiver pronto, clique em Gerar áudio do resumo para ouvir diretamente na página."},
 {question:"Posso criar uma playlist de resumos?",answer:"Sim. Salve os resumos na Minha Biblioteca e reúna os conteúdos por assunto, para ouvir as narrações em sequência."},
 {question:"Quais vídeos podem ser resumidos?",answer:"A ferramenta aceita links públicos do YouTube. No plano gratuito, cada vídeo pode ter até 12 minutos; os planos Pro e Agency oferecem limites maiores."},
 {question:"O resumo substitui assistir ao vídeo original?",answer:"Não. O texto destaca informações principais, mas pode omitir detalhes. Consulte o vídeo original para conferir informações importantes."},
];
export async function generateMetadata(){return getToolMetadataAsync(slug);}
export default function YouTubeSummaryPage(){
 const schema=buildToolPageSchema({name:"Resumir Vídeo do YouTube com IA",slug,description,
  applicationCategory:"EducationalApplication",
  breadcrumbs:[{name:"Início",href:"/"},{name:"Ferramentas",href:"/ferramentas"},{name:"Vídeos",href:"/ferramentas/videos"},{name:"Resumir Vídeo do YouTube",href:"/ferramentas/resumir-video-youtube"}],faqs
 });
 return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
  <ToolPageShell title="Resumir Vídeo do YouTube com IA" description="Crie resumos, ouça a narração e organize seus vídeos favoritos para estudar com mais praticidade." categoryName="Vídeos" categoryHref="/ferramentas/videos" showPrivacyNotice={false}>
   <VideoSummaryClient/>
  </ToolPageShell>
  <ToolEditorialLayout slug={slug}
   overview={[
    "O Resumidor de Vídeos do YouTube do Kivai ajuda você a transformar conteúdos públicos em resumos objetivos, organizados por ideias principais. É uma forma prática de revisar aulas, palestras, entrevistas e conteúdos educativos.",
    "Depois de gerar o resumo, você pode ler o texto ou criar uma narração para ouvir diretamente no site. Salve conteúdos na Minha Biblioteca e organize playlists por tema para continuar seus estudos.",
    "A análise destaca pontos importantes do vídeo, mas não substitui a fonte original. Consulte o vídeo para confirmar informações, números e referências."
   ]}
   useCases={[
    {title:"Revisar aulas e palestras",description:"Retome conceitos importantes sem precisar procurar cada trecho do vídeo."},
    {title:"Organizar conteúdo por assunto",description:"Salve resumos e monte playlists de estudos com narrações para ouvir em sequência."},
    {title:"Acompanhar vídeos informativos",description:"Leia um panorama do vídeo e escolha os temas que merece aprofundar."}
   ]}
   steps={[
    "Cole um link público do YouTube.",
    "Clique em Gerar resumo inteligente e leia o resultado.",
    "Clique em Gerar áudio do resumo para ouvir a narração.",
    "Salve o conteúdo na Minha Biblioteca e organize playlists por tema."
   ]}
   specificationsTitle="Recursos disponíveis"
   specifications={[
    {label:"Vídeos",value:"Links públicos do YouTube."},
    {label:"Resumo",value:"Texto com ideias principais do vídeo."},
    {label:"Áudio",value:"Narração disponível depois da geração do resumo."},
    {label:"Biblioteca",value:"Salve resumos e organize playlists em sua conta Kivai."},
    {label:"Duração",value:"Até 12 minutos por vídeo no gratuito, 30 minutos no Pro e 60 minutos no Agency."},
    {label:"Uso gratuito",value:"Até 3 resumos e 3 narrações por mês."}
   ]}
   privacy="Para gerar o resumo, o endereço e o conteúdo público do vídeo são analisados por um serviço de inteligência artificial. Os vídeos originais não são armazenados no Kivai. O usuário escolhe quais resumos e narrações deseja guardar na própria biblioteca."
   limitations={[
    "Vídeos privados, indisponíveis ou com acesso restrito podem não ser analisados.",
    "O resumo pode deixar de fora detalhes do vídeo original.",
    "A reprodução contínua pode variar conforme o navegador e as configurações do dispositivo.",
    "Os vídeos originais não são armazenados na Biblioteca."
   ]}
   faqs={faqs}
   relatedTools={[
    {href:"/ferramentas/video-para-audio",label:"Vídeo para Áudio"},
    {href:"/ferramentas/compressor-de-videos",label:"Compressor de Vídeos"},
    {href:"/ferramentas/planejador-de-conteudo-social-media",label:"Planejador de Conteúdo Social Media"}
   ]}
   afterFaq={<AdSlot placement="tool-bottom"/>}
  />
 </>;
}
