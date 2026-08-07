import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CookieSettingsButton } from "@/components/privacy/cookie-settings-button";

export const metadata: Metadata = {
  title: { absolute: "Política de Privacidade | Kivai" },
  description:
    "Saiba quais dados o Kivai trata, para quais finalidades, como usamos cookies e como exercer seus direitos de privacidade.",
  alternates: { canonical: "/privacidade" },
};

const externalLinks = [
  {
    href: "https://policies.google.com/technologies/partner-sites?hl=pt-BR",
    label: "Como o Google usa informações de sites e apps parceiros",
  },
  {
    href: "https://myadcenter.google.com/",
    label: "Minha Central de Anúncios do Google",
  },
  {
    href: "https://policies.google.com/privacy?hl=pt-BR",
    label: "Política de Privacidade do Google",
  },
  {
    href: "https://tools.google.com/dlpage/gaoptout?hl=pt-BR",
    label: "Complemento do navegador para desativar o Google Analytics",
  },
  {
    href: "https://resend.com/legal/privacy-policy",
    label: "Política de Privacidade do Resend",
  },
  {
    href: "https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares",
    label: "Direitos dos titulares — Autoridade Nacional de Proteção de Dados",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <article className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para a página inicial
        </Link>

        <header className="mt-8">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Documento oficial
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: 6 de agosto de 2026
          </p>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
            Esta Política explica como o Kivai trata dados pessoais durante o uso
            do site, das ferramentas, do formulário de contato e dos recursos
            opcionais de análise e publicidade.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <PolicySection title="1. Controlador e abrangência">
            <p>
              O controlador dos dados pessoais descritos nesta Política é o
              Kivai, sob responsabilidade de Marcus Vissali. Esta Política se
              aplica às páginas e ferramentas disponíveis em kivai.com.br.
            </p>
            <p>
              Dúvidas, solicitações e o exercício de direitos podem ser enviados
              pelo nosso <Link href="/contato">formulário de contato</Link>.
            </p>
          </PolicySection>

          <PolicySection title="2. Dados que podemos tratar">
            <ul>
              <li>
                <strong>Dados fornecidos por você:</strong> nome, e-mail,
                assunto e conteúdo da mensagem enviados pelo formulário de
                contato.
              </li>
              <li>
                <strong>Dados técnicos:</strong> endereço IP, data e hora do
                acesso, URL visitada, navegador, sistema operacional, tipo de
                dispositivo e registros necessários à segurança e ao
                funcionamento do serviço.
              </li>
              <li>
                <strong>Dados de uso e identificadores:</strong> interações com
                páginas e ferramentas, cookies, armazenamento local,
                identificadores de publicidade, pixels, web beacons e
                tecnologias semelhantes, somente conforme as preferências de
                consentimento aplicáveis.
              </li>
            </ul>
            <p>
              Não solicitamos dados pessoais sensíveis nas ferramentas ou no
              formulário. Evite incluir esse tipo de informação em mensagens e
              arquivos.
            </p>
          </PolicySection>

          <PolicySection title="3. Finalidades e bases legais">
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="bg-white/5 text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tratamento</th>
                    <th className="px-4 py-3 font-semibold">Finalidade</th>
                    <th className="px-4 py-3 font-semibold">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="px-4 py-4">Operação e segurança</td>
                    <td className="px-4 py-4">
                      Entregar funcionalidades, prevenir abusos, limitar
                      tentativas e diagnosticar falhas.
                    </td>
                    <td className="px-4 py-4">
                      Legítimo interesse e cumprimento de obrigações legais,
                      conforme aplicável.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Contato</td>
                    <td className="px-4 py-4">
                      Receber, encaminhar e responder dúvidas, sugestões ou
                      relatos de problemas.
                    </td>
                    <td className="px-4 py-4">
                      Procedimentos solicitados pelo titular e legítimo
                      interesse em responder à comunicação.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Análise de uso</td>
                    <td className="px-4 py-4">
                      Entender o desempenho e melhorar páginas e ferramentas.
                    </td>
                    <td className="px-4 py-4">Consentimento.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Publicidade</td>
                    <td className="px-4 py-4">
                      Exibir e medir anúncios, caso esse recurso seja habilitado.
                    </td>
                    <td className="px-4 py-4">Consentimento.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PolicySection>

          <PolicySection title="4. Ferramentas e arquivos">
            <p>
              Quando uma ferramenta informar que o processamento ocorre no
              navegador, o conteúdo inserido ou o arquivo selecionado é tratado
              localmente no seu dispositivo e não é enviado ao servidor do
              Kivai para executar aquela função. Essa regra deve ser verificada
              na página de cada ferramenta, pois integrações externas futuras
              poderão ter funcionamento diferente e serão identificadas antes
              do uso.
            </p>
          </PolicySection>

          <PolicySection title="5. Cookies e preferências">
            <p>
              O Kivai separa as tecnologias em três categorias: necessárias,
              usadas para operação, segurança e registro da sua escolha;
              analíticas, usadas para medir a utilização; e de publicidade,
              usadas para anúncios e sua medição quando disponíveis.
            </p>
            <p>
              As categorias analítica e de publicidade permanecem desativadas
              até uma escolha expressa. A recusa não impede o uso dos recursos
              essenciais. A preferência é salva no armazenamento local do
              navegador e permanece até você apagá-la, alterar a decisão ou até
              o Kivai substituir a versão do consentimento.
            </p>
            <div className="pt-1">
              <CookieSettingsButton />
            </div>
          </PolicySection>

          <PolicySection title="6. Google Analytics">
            <p>
              Se você autorizar cookies analíticos e o serviço estiver
              configurado, o Google Analytics poderá tratar dados técnicos,
              páginas visitadas, eventos de uso, endereço IP e identificadores
              para gerar estatísticas agregadas de audiência e desempenho. O
              Kivai usa essas informações para compreender e melhorar o site.
            </p>
            <p>
              Você pode retirar o consentimento nas configurações de cookies,
              apagar cookies pelo navegador ou usar o complemento de desativação
              indicado na seção 13.
            </p>
          </PolicySection>

          <PolicySection title="7. Google AdSense e publicidade">
            <p>
              O Kivai poderá usar o Google AdSense quando o serviço estiver
              aprovado, habilitado e houver consentimento para publicidade. O
              Google e fornecedores parceiros poderão inserir ou ler cookies,
              identificadores e tecnologias semelhantes no seu dispositivo para
              exibir e medir anúncios.
            </p>
            <p>
              Os cookies de publicidade do Google permitem que o Google e seus
              parceiros apresentem anúncios com base nas visitas a este site e,
              quando a personalização estiver autorizada, em visitas anteriores
              a outros sites. Também podem ser tratados URL, endereço IP,
              informações do navegador, identificadores, pixels e web beacons
              para entrega de anúncios, medição, prevenção de fraude e abuso e
              personalização.
            </p>
            <p>
              Você pode retirar o consentimento no Kivai a qualquer momento e
              controlar a personalização de anúncios na Minha Central de
              Anúncios do Google. Se o Kivai habilitar redes de publicidade além
              do Google, esta Política será atualizada para identificar os
              fornecedores e seus mecanismos de desativação.
            </p>
          </PolicySection>

          <PolicySection title="8. Prestadores, compartilhamento e transferências internacionais">
            <p>
              O Kivai não vende dados pessoais. Podemos compartilhá-los, no
              limite necessário, com provedores que apoiam a operação do site:
              hospedagem e infraestrutura, Google Analytics, Google AdSense e o
              Resend, que encaminha as mensagens do formulário por e-mail.
              Também poderá haver compartilhamento para cumprir obrigação legal,
              ordem de autoridade competente ou proteger direitos e segurança.
            </p>
            <p>
              Google, Resend e fornecedores de infraestrutura podem tratar
              informações em outros países. Nesses casos, o tratamento fica
              sujeito aos contratos, políticas do fornecedor e mecanismos de
              proteção exigidos pela legislação aplicável.
            </p>
          </PolicySection>

          <PolicySection title="9. Retenção e eliminação">
            <p>
              Mantemos dados somente pelo período necessário às finalidades
              descritas. Mensagens de contato e registros relacionados podem ser
              conservados enquanto forem necessários para responder, documentar
              o atendimento, prevenir abusos, exercer direitos ou cumprir
              obrigações legais. Registros técnicos seguem períodos compatíveis
              com segurança, operação e exigências legais. Encerrada a
              finalidade, os dados são eliminados ou anonimizados, salvo quando
              a conservação for permitida ou exigida por lei.
            </p>
          </PolicySection>

          <PolicySection title="10. Direitos do titular">
            <p>
              Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), você
              pode solicitar, conforme aplicável: confirmação do tratamento;
              acesso; correção; anonimização, bloqueio ou eliminação; informação
              sobre compartilhamentos; portabilidade; revogação do consentimento;
              eliminação de dados tratados com consentimento; oposição; e revisão
              de decisões automatizadas.
            </p>
            <p>
              Para exercer um direito, use a <Link href="/contato">página de
              contato</Link> e descreva a solicitação. Poderemos pedir informações
              adicionais estritamente necessárias para confirmar sua identidade
              e proteger os dados contra acesso indevido.
            </p>
          </PolicySection>

          <PolicySection title="11. Segurança e limites">
            <p>
              Adotamos medidas técnicas e administrativas proporcionais para
              reduzir riscos de acesso, alteração, divulgação ou destruição não
              autorizados. Nenhum sistema conectado à internet, entretanto, é
              totalmente imune a incidentes. Se identificarmos um incidente que
              possa causar risco ou dano relevante, adotaremos as medidas de
              resposta e comunicação exigidas pela legislação.
            </p>
          </PolicySection>

          <PolicySection title="12. Atualizações e contato">
            <p>
              Esta Política poderá ser atualizada para refletir mudanças nas
              ferramentas, fornecedores ou requisitos legais. A data no início
              do documento indicará a versão vigente. Para dúvidas ou solicitações
              de privacidade, acesse a <Link href="/contato">página de contato</Link>.
            </p>
          </PolicySection>

          <PolicySection title="13. Controles e documentos externos">
            <p>
              Consulte os controles e documentos oficiais dos fornecedores para
              entender e gerenciar tratamentos realizados fora do Kivai:
            </p>
            <ul className="list-none space-y-3 pl-0">
              {externalLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-2"
                  >
                    <ExternalLink className="mt-1 size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </PolicySection>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/10"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para a página inicial
          </Link>
        </div>
      </article>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-8 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:underline [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
