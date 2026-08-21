import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CookieSettingsButton } from "@/components/privacy/cookie-settings-button";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Política de Privacidade",
  description:
    "Saiba quais dados o Kivai pode tratar, para quais finalidades, como usamos cookies, Analytics e publicidade e como exercer seus direitos de privacidade.",
  pathname: "/privacidade",
});

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
    label: "Complemento para desativar o Google Analytics",
  },
  {
    href: "https://resend.com/legal/privacy-policy",
    label: "Política de Privacidade do Resend",
  },
  {
    href: "https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares",
    label: "Direitos dos titulares na ANPD",
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
          <h1 className="mt-6 text-4xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: 21 de agosto de 2026
          </p>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
            Esta Política explica como o Kivai trata dados pessoais durante o uso do site,
            das ferramentas, do formulário de contato e dos recursos opcionais de análise e publicidade.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <PolicySection title="1. Controlador e abrangência">
            <p>
              O controlador dos dados pessoais descritos nesta Política é o Kivai, sob responsabilidade de Marcus Vissali.
              Esta Política se aplica às páginas e ferramentas disponibilizadas pelo domínio kivai.com.br e seus endereços oficiais.
            </p>
            <p>
              Dúvidas, solicitações e o exercício de direitos podem ser enviados pelo nosso <Link href="/contato">formulário de contato</Link>.
            </p>
          </PolicySection>

          <PolicySection title="2. Dados que podemos tratar">
            <ul>
              <li><strong>Dados fornecidos por você:</strong> nome, e-mail, assunto e conteúdo das mensagens enviadas pelo formulário de contato.</li>
              <li><strong>Dados técnicos:</strong> endereço IP, data e hora, endereço acessado, navegador, sistema operacional, tipo de dispositivo e registros necessários à operação, segurança e prevenção de abuso.</li>
              <li><strong>Dados de uso e identificadores opcionais:</strong> interações com páginas, cookies, armazenamento local, identificadores e tecnologias semelhantes quando a respectiva categoria estiver autorizada ou quando houver outra base legal aplicável.</li>
            </ul>
            <p>
              O Kivai não solicita deliberadamente dados pessoais sensíveis para o uso comum das ferramentas. Evite enviar senhas,
              informações bancárias, documentos confidenciais ou outros dados sensíveis pelo formulário de contato.
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
                    <td className="px-4 py-4">Entregar funcionalidades, diagnosticar falhas, prevenir abuso e proteger a plataforma.</td>
                    <td className="px-4 py-4">Legítimo interesse e cumprimento de obrigações legais, conforme aplicável.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Contato</td>
                    <td className="px-4 py-4">Receber e responder dúvidas, sugestões e relatos técnicos.</td>
                    <td className="px-4 py-4">Procedimentos solicitados pelo titular e legítimo interesse em responder à comunicação.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Análise de uso</td>
                    <td className="px-4 py-4">Medir audiência, desempenho e melhorar o site.</td>
                    <td className="px-4 py-4">Consentimento, quando exigido.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Publicidade</td>
                    <td className="px-4 py-4">Exibir, limitar, medir e, quando permitido, personalizar anúncios.</td>
                    <td className="px-4 py-4">Consentimento, quando exigido.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PolicySection>

          <PolicySection title="4. Ferramentas, arquivos e processamento">
            <p>
              O comportamento dos arquivos depende da ferramenta utilizada. Quando uma página informar que o processamento ocorre localmente,
              o arquivo é tratado pelo navegador para executar aquela função e não precisa ser enviado ao servidor do Kivai para esse processamento específico.
            </p>
            <p>
              Outras ferramentas podem utilizar infraestrutura do Kivai ou serviços de terceiros. Nesses casos, o funcionamento e eventuais limitações
              devem ser informados na própria ferramenta ou em documentação associada. Não presumimos que todas as ferramentas funcionem da mesma forma.
            </p>
            <p>
              Para orientações gerais sobre proteção e processamento de arquivos, consulte nossa página de <Link href="/seguranca">Segurança</Link>.
            </p>
          </PolicySection>

          <PolicySection title="5. Cookies, armazenamento local e preferências">
            <p>
              O Kivai organiza as tecnologias em categorias necessárias, analíticas e de publicidade. Recursos necessários podem ser usados para funcionamento,
              segurança e registro das suas preferências. Recursos analíticos e publicitários são controlados pelas escolhas disponíveis no mecanismo de consentimento do site.
            </p>
            <p>
              A preferência escolhida é salva no navegador para que o Kivai possa reaplicá-la nas visitas seguintes. Você pode alterar sua decisão a qualquer momento
              pelo controle abaixo ou limpar os dados do navegador.
            </p>
            <div className="pt-1"><CookieSettingsButton /></div>
          </PolicySection>

          <PolicySection title="6. Google Analytics">
            <p>
              Quando autorizado e configurado, o Google Analytics pode tratar informações técnicas, páginas visitadas, eventos de uso, identificadores e outras
              informações necessárias para produzir estatísticas sobre audiência e desempenho. O Kivai utiliza esses dados para compreender e melhorar o serviço.
            </p>
            <p>
              As escolhas relacionadas a Analytics podem ser alteradas nas configurações de cookies. O Google também disponibiliza controles próprios indicados ao final desta Política.
            </p>
          </PolicySection>

          <PolicySection title="7. Google AdSense e publicidade">
            <p>
              O Kivai poderá utilizar o Google AdSense quando a conta, o site e os espaços publicitários estiverem habilitados. O carregamento de recursos de publicidade
              é controlado pelas configurações aplicáveis de consentimento e elegibilidade da página.
            </p>
            <p>
              Quando publicidade estiver ativa, Google e parceiros de tecnologia de anúncios podem tratar informações como endereço IP, URL, dados do navegador,
              cookies, identificadores e sinais de interação para entrega de anúncios, medição, limitação de frequência, segurança, prevenção de fraude e, quando autorizado, personalização.
            </p>
            <p>
              O uso de publicidade em determinadas regiões pode exigir mecanismos adicionais de consentimento ou plataformas certificadas pelos fornecedores.
              O Kivai poderá adaptar seu mecanismo de consentimento conforme a origem do tráfego e os requisitos aplicáveis.
            </p>
            <p>
              Você pode alterar suas preferências no Kivai e também usar os controles disponibilizados pelo Google na Minha Central de Anúncios.
            </p>
          </PolicySection>

          <PolicySection title="8. Prestadores, compartilhamento e transferências internacionais">
            <p>
              O Kivai não comercializa dados pessoais como produto. Informações podem ser compartilhadas, no limite necessário, com prestadores que apoiam hospedagem,
              infraestrutura, análise, publicidade e comunicação, incluindo Google e Resend, conforme o recurso efetivamente utilizado.
            </p>
            <p>
              Também poderá ocorrer compartilhamento para cumprir obrigação legal, atender autoridade competente, investigar abuso ou proteger direitos, usuários e a segurança da plataforma.
            </p>
            <p>
              Alguns fornecedores podem tratar informações fora do Brasil. Nesses casos, o tratamento está sujeito às políticas dos fornecedores, aos contratos aplicáveis
              e às regras legais de transferência internacional.
            </p>
          </PolicySection>

          <PolicySection title="9. Retenção e eliminação">
            <p>
              O Kivai procura manter dados apenas pelo período necessário às finalidades descritas. Mensagens de contato e registros associados podem ser conservados
              enquanto forem necessários para atendimento, segurança, prevenção de abuso, exercício de direitos ou cumprimento de obrigações legais.
            </p>
            <p>
              Prazos específicos de retenção de arquivos não são generalizados nesta Política porque dependem da arquitetura de cada ferramenta. Quando uma ferramenta
              enviar arquivos a servidor ou terceiro e houver regra própria de retenção, ela deverá ser informada de forma adequada.
            </p>
          </PolicySection>

          <PolicySection title="10. Direitos do titular">
            <p>
              Nos termos da LGPD, você pode exercer, conforme aplicável, direitos relacionados à confirmação e acesso ao tratamento, correção, anonimização, bloqueio ou eliminação,
              informação sobre compartilhamentos, portabilidade, revogação do consentimento, oposição e demais direitos previstos em lei.
            </p>
            <p>
              Para fazer uma solicitação, utilize a <Link href="/contato">página de contato</Link>. Poderemos solicitar informações adicionais estritamente necessárias
              para confirmar a identidade do solicitante e evitar acesso indevido a dados de terceiros.
            </p>
          </PolicySection>

          <PolicySection title="11. Segurança e limites">
            <p>
              Adotamos medidas técnicas e administrativas proporcionais ao contexto do serviço para reduzir riscos de acesso, alteração, divulgação ou destruição não autorizados.
              Nenhum sistema conectado à internet é totalmente imune a incidentes.
            </p>
            <p>
              Consulte também a página de <Link href="/seguranca">Segurança do Kivai</Link> para orientações sobre processamento de arquivos e boas práticas de uso.
            </p>
          </PolicySection>

          <PolicySection title="12. Crianças e adolescentes">
            <p>
              O Kivai não é direcionado especificamente à coleta de dados de crianças. Caso sejam identificadas situações que exijam tratamento diferenciado conforme a legislação,
              adotaremos as medidas aplicáveis ao contexto e ao melhor interesse do titular.
            </p>
          </PolicySection>

          <PolicySection title="13. Atualizações e contato">
            <p>
              Esta Política pode ser atualizada para refletir mudanças nas ferramentas, fornecedores, práticas de tratamento ou requisitos legais.
              A data indicada no início do documento representa a versão vigente.
            </p>
            <p>
              Para dúvidas sobre esta Política ou sobre privacidade, utilize a <Link href="/contato">página de contato</Link>. Para dúvidas gerais sobre o uso da plataforma,
              consulte também a <Link href="/ajuda">Central de Ajuda</Link>.
            </p>
          </PolicySection>

          <PolicySection title="14. Controles e documentos externos">
            <p>Os links abaixo levam a documentos e controles mantidos por terceiros:</p>
            <ul className="list-none space-y-3 pl-0">
              {externalLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2">
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
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/10">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para a página inicial
          </Link>
        </div>
      </article>
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-8 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}
