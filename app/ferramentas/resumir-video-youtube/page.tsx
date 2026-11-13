import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { getToolMetadataAsync } from "@/lib/seo";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import VideoSummaryClient from "../transcrever-resumir-video/preview-client";

const slug="resumir-video-youtube";
const description="Transforme vídeos públicos do YouTube em resumos inteligentes e narrações em áudio geradas automaticamente. Leia, ouça e organize seus estudos em playlists."
const faqs=[
 {question:"Como resumir um vídeo do YouTube?",answer:"Cole o link público do YouTube e clique em Gerar resumo e áudio. A IA prepara o texto e inicia automaticamente a narração, que aparece no player assim que estiver pronta."},
 {question:"O áudio é gerado automaticamente?",answer:"Sim. Depois de gerar o resumo, o Kivai inicia automaticamente a criação da narração em português brasileiro. Você pode ler o texto enquanto o áudio é preparado."},
 {question:"Posso criar uma playlist de resumos?",answer:"Sim. Salve os resumos na Minha Biblioteca e reúna os conteúdos por assunto, para ouvir as narrações em sequência."},
 {question:"Como funciona o acesso à ferramenta?",answer:"O acesso e os limites de uso dependem do plano Kivai contratado. Consulte a página de planos para conhecer as opções disponíveis."},
 {question:"Quais vídeos podem ser resumidos?",answer:"A ferramenta aceita links públicos do YouTube com até 60 minutos de duração."},
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
  <ToolPageShell title="Resumir Vídeo do YouTube com IA" description="Gere resumo e narração automaticamente em uma única operação. Leia, ouça e organize seus estudos com inteligência artificial." categoryName="Vídeos" categoryHref="/ferramentas/videos" showPrivacyNotice={false}>
   <VideoSummaryClient/>
  </ToolPageShell>
  <ToolEditorialLayout slug={slug}
   overview={[
    "O Resumidor de Vídeos do YouTube do Kivai ajuda você a transformar conteúdos públicos em resumos objetivos, organizados por ideias principais. É uma forma prática de revisar aulas, palestras, entrevistas e conteúdos educativos.",
    "Com um único comando, o Kivai gera o resumo e inicia automaticamente a narração em português brasileiro. Você já pode ler o conteúdo enquanto o áudio é preparado. Depois, salve os dois resultados na Minha Biblioteca e organize playlists por tema.",
    "A análise destaca pontos importantes do vídeo, mas não substitui a fonte original. Consulte o vídeo para confirmar informações, números e referências."
   ]}
   useCases={[
    {title:"Revisar aulas e palestras",description:"Retome conceitos importantes sem precisar procurar cada trecho do vídeo."},
    {title:"Organizar conteúdo por assunto",description:"Salve resumos e monte playlists de estudos com narrações para ouvir em sequência."},
    {title:"Acompanhar vídeos informativos",description:"Leia um panorama do vídeo e escolha os temas que merece aprofundar."}
   ]}
   steps={[
    "Cole um link público do YouTube.",
    "Clique em Gerar resumo e áudio. O texto será exibido primeiro e a narração começará automaticamente.",
    "Leia o resumo enquanto o áudio é preparado e use o player para ouvir.",
    "Entre ou crie sua conta para salvar o resumo e a narração na Minha Biblioteca."
   ]}
   specificationsTitle="Recursos disponíveis"
   specifications={[
    {label:"Vídeos",value:"Links públicos do YouTube."},
    {label:"Resumo",value:"Texto com ideias principais do vídeo."},
    {label:"Áudio",value:"Narração em português brasileiro iniciada automaticamente após o resumo."},
    {label:"Biblioteca",value:"Salve resumos e organize playlists em sua conta Kivai."},
    {label:"Duração",value:"Vídeos públicos de até 60 minutos."},
    {label:"Acesso",value:"Consulte os planos Kivai para conhecer os limites e benefícios disponíveis."},
    {label:"Organização",value:"Biblioteca e playlists para organizar os conteúdos salvos."}
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
   afterFaq={<>
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-6 sm:p-8">
     <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Conheça o Kivai</p>
     <h2 className="mt-2 text-xl font-semibold">Transforme vídeos em conhecimento, com texto e áudio</h2>
     <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Tenha mais recursos para organizar seus estudos, salvar projetos e aproveitar as ferramentas inteligentes do Kivai. Consulte os planos e escolha o que acompanha sua rotina.</p>
     <a href="/planos" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Conhecer planos Kivai</a>
    </section>
    <AdSlot placement="tool-bottom"/>
   </>}
  />
 </>;
}
