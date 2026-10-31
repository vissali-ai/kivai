import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { getToolMetadataAsync } from "@/lib/seo";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import CorretorDeTextoClient from "./corretor-de-texto-client";

const slug = "corretor-de-texto";
const description = "Corrija ortografia, gramática, pontuação e concordância com inteligência artificial e compare o texto original com o revisado.";
const faqs = [
  { question: "O corretor é gratuito?", answer: "O Kivai disponibiliza créditos gratuitos conforme as regras vigentes da conta. Cada correção com IA custa 1 crédito e exige login." },
  { question: "A IA altera o sentido do texto?", answer: "A ferramenta foi orientada a preservar o significado e os fatos originais. Revise sempre o resultado antes de publicar." },
  { question: "É necessário criar uma conta?", answer: "Sim, você pode digitar o texto sem conta, mas precisa entrar para executar a revisão com créditos." },
  { question: "O que é corrigido?", answer: "Ortografia, gramática, pontuação, concordância, clareza e coesão em português brasileiro." },
];
export async function generateMetadata() { return getToolMetadataAsync(slug); }
export default function CorretorDeTextoPage() {
  const schema = buildToolPageSchema({ name: "Corretor de Texto com IA", slug, description, applicationCategory: "BusinessApplication", breadcrumbs: [
    { name: "Início", href: "/" }, { name: "Ferramentas", href: "/ferramentas" }, { name: "Texto", href: "/ferramentas/texto" }, { name: "Corretor de Texto com IA", href: "/ferramentas/corretor-de-texto" },
  ], faqs });
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <CorretorDeTextoClient />
    <ToolEditorialLayout slug={slug}
      overview={["Revise seus textos em português brasileiro com inteligência artificial, corrigindo ortografia, gramática e pontuação. O resultado apresenta o original ao lado da versão corrigida.", "A ferramenta utiliza autenticação e o sistema de créditos Kivai: cada revisão custa 1 crédito, incluindo créditos gratuitos disponíveis na conta."]}
      useCases={[{ title: "Textos profissionais", description: "Revise mensagens, propostas e comunicados." }, { title: "Conteúdo digital", description: "Ajuste legendas, anúncios e publicações antes de divulgar." }, { title: "Estudos", description: "Entenda erros comuns e melhore a clareza de textos acadêmicos." }]}
      steps={["Digite ou cole até 8.000 caracteres.", "Escolha se deseja preservar seu estilo ou ajustar o tom.", "Entre na conta Kivai para utilizar a revisão por IA.", "Execute a correção usando 1 crédito.", "Compare as versões e copie o texto revisado."]}
      specifications={[{ label: "Idioma", value: "Português brasileiro." }, { label: "Limite", value: "De 10 a 8.000 caracteres por revisão." }, { label: "Créditos", value: "1 crédito por correção concluída." }, { label: "Resultado", value: "Texto revisado e explicações das principais alterações." }]}
      privacy="Ao clicar em Corrigir texto com IA, o texto é enviado ao serviço Kivai e ao provedor externo de IA. Evite inserir informações pessoais, sigilosas ou confidenciais."
      limitations={["Correções geradas por IA podem conter erros e exigem revisão humana.", "Não substitui revisão jurídica, médica ou técnica especializada.", "Uma solicitação precisa de login e crédito disponível."]}
      faqs={faqs}
      relatedTools={[{ href: "/ferramentas/contador-de-palavras", label: "Contador de Palavras" }, { href: "/ferramentas/contador-de-caracteres-instagram", label: "Contador de Caracteres para Instagram" }]}
      afterFaq={<AdSlot placement="tool-bottom" />}
    />
  </>;
}
