import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Termos de Uso | Kivai" },
  description:
    "Conheça as condições para utilizar as ferramentas, conteúdos e serviços disponibilizados pelo Kivai.",
  alternates: { canonical: "/termos" },
};

const legalReferences = [
  {
    href: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm",
    label: "Marco Civil da Internet - Lei nº 12.965/2014",
  },
  {
    href: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    label: "Código de Defesa do Consumidor - Lei nº 8.078/1990",
  },
  {
    href: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
    label: "Lei Geral de Proteção de Dados Pessoais - Lei nº 13.709/2018",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <article className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para a página inicial
        </Link>

        <header className="mt-8">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Documento oficial</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">Termos de Uso</h1>
          <p className="mt-3 text-sm text-muted-foreground">Última atualização: 21 de agosto de 2026</p>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
            Estes Termos estabelecem as condições para acessar o Kivai e utilizar suas ferramentas, conteúdos e páginas de serviços. Leia o documento antes de utilizar a plataforma.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <TermsSection title="1. Identificação, abrangência e aceitação">
            <p>O Kivai é um projeto mantido por Marcus Vissali que reúne ferramentas digitais, conteúdo informativo e páginas de apresentação de serviços. Estes Termos se aplicam às páginas e funcionalidades disponibilizadas em kivai.com.br.</p>
            <p>Ao utilizar o site, você declara ter lido estes Termos e tomado ciência da nossa <Link href="/privacidade">Política de Privacidade</Link>. As preferências relacionadas a cookies e tecnologias opcionais são tratadas separadamente. Se não concordar com estas condições, não utilize a plataforma.</p>
            <p>Pessoas menores de 18 anos devem utilizar o site com orientação e autorização de responsável legal quando isso for aplicável.</p>
          </TermsSection>

          <TermsSection title="2. O que o Kivai oferece">
            <p>O Kivai disponibiliza ferramentas para diferentes tarefas digitais, incluindo operações com imagens, documentos, arquivos, texto, vídeo, cálculos e produtividade, além de conteúdos explicativos e páginas sobre serviços profissionais.</p>
            <p>Funcionalidades, formatos aceitos, limites, requisitos e modo de processamento podem variar entre ferramentas. As informações específicas apresentadas na página de cada ferramenta integram as condições de uso daquela funcionalidade.</p>
            <p>A apresentação de um serviço profissional e o envio de uma mensagem pelo formulário de contato não constituem, por si só, contratação. Escopo, preço, prazo, responsabilidades e entregas de eventual serviço serão definidos em proposta, contrato ou instrumento próprio.</p>
          </TermsSection>

          <TermsSection title="3. Processamento de arquivos e conteúdo do usuário">
            <p>O modo de processamento depende da ferramenta. Quando a página informar que uma operação ocorre localmente no navegador, o arquivo ou conteúdo utilizado para executar aquela função não precisa ser enviado ao servidor do Kivai. Funcionalidades que dependam de servidor, infraestrutura remota ou terceiros podem possuir fluxo diferente e devem ser tratadas conforme suas informações específicas e a <Link href="/privacidade">Política de Privacidade</Link>.</p>
            <p>Você permanece responsável pelos arquivos, textos, imagens e demais conteúdos utilizados. Ao submetê-los a uma ferramenta, declara possuir os direitos, permissões e autorizações necessários para esse uso.</p>
            <p>Não utilize o Kivai para processar material ilícito, malicioso, obtido sem autorização, que viole propriedade intelectual, privacidade ou outros direitos de terceiros.</p>
            <p>Mantenha cópias dos arquivos originais. Salvo quando uma funcionalidade informar expressamente o contrário, o Kivai não deve ser utilizado como serviço de armazenamento, backup ou guarda documental.</p>
          </TermsSection>

          <TermsSection title="4. Uso permitido e condutas proibidas">
            <p>Você concorda em utilizar o Kivai de maneira lícita, responsável e compatível com a finalidade das ferramentas. É proibido:</p>
            <ul>
              <li>utilizar a plataforma para fraude, falsificação, violação de direitos, assédio ou qualquer atividade ilegal;</li>
              <li>enviar malware, código destrutivo ou conteúdo destinado a comprometer dispositivos, dados ou infraestrutura;</li>
              <li>contornar deliberadamente limites, controles de segurança ou mecanismos de proteção do site;</li>
              <li>realizar automações abusivas, sobrecarga, varredura ou interferência capaz de prejudicar a disponibilidade da plataforma;</li>
              <li>utilizar a marca, identidade visual ou comunicação do Kivai de modo a criar falsa associação ou representação;</li>
              <li>usar resultados automatizados em situações críticas sem realizar a validação adequada.</li>
            </ul>
          </TermsSection>

          <TermsSection title="5. Resultados das ferramentas">
            <p>As ferramentas executam operações com base nos dados, arquivos, configurações e parâmetros fornecidos pelo usuário. Resultados podem variar em razão de formato, qualidade da entrada, arredondamentos, recursos do navegador, dispositivo, bibliotecas utilizadas ou outras limitações técnicas.</p>
            <p>O usuário é responsável por revisar o resultado antes de utilizá-lo, especialmente quando erros possam gerar consequências relevantes. A disponibilidade de uma ferramenta não representa garantia de que ela será adequada a toda finalidade específica.</p>
          </TermsSection>

          <TermsSection title="6. Calculadoras e informações de apoio">
            <p>Calculadoras financeiras, comerciais, de marketing ou de outras categorias possuem finalidade informativa e de apoio. Seus resultados não constituem consultoria contábil, financeira, jurídica, fiscal ou profissional e não representam promessa de lucro, retorno, economia ou desempenho.</p>
            <p>Confira dados e premissas antes de tomar decisões relevantes e procure orientação profissional quando a situação exigir análise especializada.</p>
          </TermsSection>

          <TermsSection title="7. Disponibilidade, compatibilidade e evolução">
            <p>O Kivai está em evolução contínua. Podemos corrigir, atualizar, reorganizar, limitar, substituir ou descontinuar ferramentas e funcionalidades para melhorar qualidade, segurança, desempenho ou viabilidade do projeto.</p>
            <p>Manutenções, incompatibilidades, limitações do navegador ou dispositivo, falhas de infraestrutura, bibliotecas ou serviços de terceiros e eventos fora do controle razoável podem causar indisponibilidade ou alteração de comportamento. Não garantimos funcionamento ininterrupto nem compatibilidade com todos os formatos, navegadores ou dispositivos.</p>
            <p>Orientações para situações comuns estão disponíveis na <Link href="/ajuda">Central de Ajuda</Link>.</p>
          </TermsSection>

          <TermsSection title="8. Publicidade, monetização e serviços de terceiros">
            <p>O Kivai pode utilizar publicidade como forma de financiar a manutenção e evolução da plataforma, inclusive por meio do Google AdSense quando o serviço estiver aprovado e habilitado. O tratamento de dados e tecnologias relacionadas à publicidade deve observar as preferências e condições descritas na <Link href="/privacidade">Política de Privacidade</Link>.</p>
            <p>O site também pode utilizar infraestrutura, bibliotecas, integrações, links ou serviços fornecidos por terceiros. Esses serviços possuem seus próprios termos, políticas e condições. A presença de link, anúncio ou integração não significa garantia do Kivai sobre produtos, serviços ou conteúdo oferecidos externamente.</p>
          </TermsSection>

          <TermsSection title="9. Propriedade intelectual">
            <p>A marca Kivai, identidade visual, textos autorais, organização, elementos próprios da interface e demais materiais produzidos para o projeto são protegidos pela legislação aplicável. Bibliotecas, componentes, marcas, códigos e materiais de terceiros permanecem sujeitos aos direitos e licenças de seus respectivos titulares.</p>
            <p>O uso normal das ferramentas não transfere ao usuário direitos sobre a plataforma e não transfere ao Kivai a titularidade dos arquivos e conteúdos legítimos do usuário.</p>
            <p>Não é permitido reproduzir, republicar, vender, licenciar ou explorar comercialmente elementos protegidos do Kivai fora das hipóteses permitidas por lei ou sem autorização.</p>
          </TermsSection>

          <TermsSection title="10. Privacidade, segurança e dados pessoais">
            <p>O tratamento de dados pessoais, cookies, consentimento, fornecedores e direitos dos titulares é explicado na <Link href="/privacidade">Política de Privacidade</Link>. Informações sobre práticas e limites de segurança também estão disponíveis na página de <Link href="/seguranca">Segurança</Link>.</p>
            <p>Não envie senhas, dados bancários, documentos confidenciais ou informações pessoais desnecessárias pelo formulário de contato. Ao utilizar arquivos que contenham dados de terceiros, certifique-se de possuir autorização e fundamento adequados para esse tratamento.</p>
          </TermsSection>

          <TermsSection title="11. Responsabilidades e limites legais">
            <p>O Kivai busca oferecer ferramentas funcionais, informações claras e melhoria contínua. Ainda assim, o usuário é responsável por conferir entradas, configurações, resultados e adequação da ferramenta à finalidade pretendida.</p>
            <p>Na extensão permitida pela legislação aplicável, o Kivai não responde por decisões tomadas sem validação adequada, perda de arquivos que não sejam objeto de serviço de armazenamento, uso ilícito realizado por usuários ou terceiros, incompatibilidades externas ou danos decorrentes de eventos fora do controle razoável da plataforma.</p>
            <p>Nada nestes Termos pretende excluir ou reduzir garantias, responsabilidades ou direitos que não possam ser afastados pela legislação brasileira, inclusive direitos assegurados ao consumidor quando aplicáveis.</p>
          </TermsSection>

          <TermsSection title="12. Prevenção de abuso e proteção da plataforma">
            <p>Podemos limitar requisições, bloquear comportamentos automatizados abusivos ou adotar outras medidas técnicas proporcionais quando houver indícios de ataque, fraude, uso indevido, violação destes Termos ou risco à segurança e disponibilidade da plataforma.</p>
            <p>Quando necessário e permitido pela legislação, informações pertinentes podem ser preservadas ou fornecidas para cumprimento de obrigação legal ou ordem válida de autoridade competente.</p>
          </TermsSection>

          <TermsSection title="13. Relatos, suporte e violações">
            <p>Problemas técnicos e dúvidas podem ser encaminhados pela <Link href="/contato">página de contato</Link>. Para facilitar a análise, informe a ferramenta utilizada, o comportamento observado e, quando relevante, navegador e dispositivo.</p>
            <p>Se identificar uso do Kivai que viole direitos, estes Termos ou a legislação, utilize o mesmo canal e forneça apenas as informações necessárias para identificar e avaliar a situação.</p>
          </TermsSection>

          <TermsSection title="14. Alterações destes Termos">
            <p>Estes Termos podem ser atualizados para refletir mudanças nas ferramentas, serviços, fornecedores, modelo de operação ou legislação. A data apresentada no início desta página identifica a versão vigente.</p>
            <p>Quando uma alteração exigir nova manifestação do usuário nos termos da legislação aplicável, serão adotadas medidas apropriadas para obtê-la.</p>
          </TermsSection>

          <TermsSection title="15. Legislação aplicável e contato">
            <p>Estes Termos são regidos pela legislação brasileira. Eventuais controvérsias serão submetidas ao foro competente determinado pela legislação aplicável, preservados os direitos de escolha ou proteção assegurados ao consumidor quando cabíveis.</p>
            <p>Antes de qualquer medida, dúvidas e solicitações podem ser encaminhadas pela <Link href="/contato">página de contato</Link>.</p>
          </TermsSection>

          <TermsSection title="16. Referências legais">
            <p>Os documentos oficiais abaixo servem como referência para alguns dos direitos e deveres aplicáveis ao ambiente digital brasileiro:</p>
            <ul className="list-none space-y-3 pl-0">
              {legalReferences.map((reference) => (
                <li key={reference.href}>
                  <a href={reference.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2">
                    <ExternalLink className="mt-1 size-4 shrink-0" aria-hidden="true" />
                    {reference.label}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </TermsSection>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/10">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para a página inicial
          </Link>
        </div>
      </article>
    </main>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-8 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
