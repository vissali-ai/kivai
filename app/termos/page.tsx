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
    label: "Marco Civil da Internet — Lei nº 12.965/2014",
  },
  {
    href: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    label: "Código de Defesa do Consumidor — Lei nº 8.078/1990",
  },
  {
    href: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
    label: "Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018",
  },
];

export default function TermsPage() {
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
            Termos de Uso
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: 6 de agosto de 2026
          </p>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
            Estes Termos estabelecem as condições para acessar o site Kivai e
            utilizar suas ferramentas, conteúdos e páginas de serviços. Leia o
            documento antes de continuar.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <TermsSection title="1. Identificação e aceitação">
            <p>
              O Kivai é um projeto mantido por Marcus Vissali que reúne
              ferramentas digitais, materiais informativos e páginas de
              apresentação de serviços. Ao utilizar o site, você declara que
              leu e concorda com estes Termos e que tomou ciência da nossa{" "}
              <Link href="/privacidade">Política de Privacidade</Link>. O
              consentimento para cookies opcionais é solicitado separadamente.
              Se não concordar com estes Termos, interrompa o uso.
            </p>
            <p>
              Pessoas menores de 18 anos devem utilizar o site com orientação e
              autorização de seu responsável legal, quando aplicável.
            </p>
          </TermsSection>

          <TermsSection title="2. O que o Kivai oferece">
            <p>
              O site disponibiliza ferramentas para imagens, documentos, texto,
              vídeo, cálculos e produtividade, além de conteúdo explicativo e
              páginas sobre serviços profissionais. As funcionalidades exibidas
              como gratuitas podem ser utilizadas sem criação de conta enquanto
              permanecerem disponíveis nessa modalidade.
            </p>
            <p>
              A apresentação de um serviço profissional e o envio do formulário
              de contato não formam, por si só, uma contratação. Escopo, preço,
              prazo, responsabilidades e entregas de eventual serviço serão
              definidos em proposta ou instrumento próprio.
            </p>
          </TermsSection>

          <TermsSection title="3. Processamento de arquivos e conteúdo do usuário">
            <p>
              Algumas ferramentas processam arquivos e informações localmente no
              navegador. Quando esse for o caso, a página da ferramenta indicará
              o processamento local. Outras funcionalidades ou integrações
              futuras poderão exigir transmissão, hipótese que deverá ser
              informada antes do uso e tratada conforme a Política de
              Privacidade.
            </p>
            <p>
              Você permanece titular do conteúdo e dos arquivos utilizados nas
              ferramentas. Ao utilizá-los, declara possuir os direitos e
              autorizações necessários e assume responsabilidade pela origem,
              legalidade e finalidade do material. Não envie conteúdo ilícito,
              malicioso, confidencial sem autorização ou que viole direitos de
              terceiros.
            </p>
            <p>
              Mantenha cópias dos arquivos originais. O Kivai não funciona como
              serviço de armazenamento, backup ou guarda documental.
            </p>
          </TermsSection>

          <TermsSection title="4. Uso permitido e condutas proibidas">
            <p>Você concorda em utilizar o Kivai de forma lícita e responsável. É proibido:</p>
            <ul>
              <li>
                explorar o site para fraude, violação de direitos autorais,
                falsificação, assédio ou qualquer atividade ilegal;
              </li>
              <li>
                enviar malware, código destrutivo ou conteúdo destinado a
                comprometer dispositivos, dados ou a infraestrutura;
              </li>
              <li>
                contornar limites, controles de segurança, consentimento ou
                medidas de proteção do site;
              </li>
              <li>
                realizar varredura, extração automatizada abusiva, sobrecarga,
                engenharia reversa indevida ou interferência na operação;
              </li>
              <li>
                apresentar-se falsamente como representante do Kivai ou utilizar
                marca e identidade visual de modo a causar confusão;
              </li>
              <li>
                usar resultados das ferramentas sem a revisão necessária em
                contextos que possam afetar direitos, patrimônio ou segurança.
              </li>
            </ul>
          </TermsSection>

          <TermsSection title="5. Resultados, calculadoras e decisões importantes">
            <p>
              As ferramentas automatizam operações com base nos dados e
              parâmetros fornecidos por você. Resultados podem variar por
              arredondamentos, formato do arquivo, compatibilidade do navegador,
              qualidade da entrada ou premissas escolhidas.
            </p>
            <p>
              Calculadoras financeiras, comerciais e de marketing possuem
              finalidade informativa e de apoio. Elas não constituem consultoria
              contábil, financeira, jurídica, fiscal ou profissional, nem
              prometem lucro, retorno ou desempenho. Confira resultados críticos
              e, quando necessário, consulte um profissional qualificado.
            </p>
          </TermsSection>

          <TermsSection title="6. Disponibilidade e alterações">
            <p>
              Podemos corrigir, atualizar, limitar, substituir ou descontinuar
              funcionalidades para manter segurança, qualidade e viabilidade do
              projeto. Manutenções, falhas de terceiros, incompatibilidades e
              eventos fora do controle razoável podem causar interrupções. Não
              garantimos disponibilidade contínua ou compatibilidade com todo
              dispositivo, navegador e tipo de arquivo.
            </p>
          </TermsSection>

          <TermsSection title="7. Publicidade e serviços de terceiros">
            <p>
              O Kivai poderá exibir publicidade, inclusive por meio do Google
              AdSense, quando esse recurso estiver aprovado e habilitado. O
              carregamento de publicidade e análise depende das preferências de
              consentimento aplicáveis, conforme explicado na{" "}
              <Link href="/privacidade">Política de Privacidade</Link>.
            </p>
            <p>
              Links, anúncios e integrações de terceiros são regidos também
              pelos termos e políticas de seus respectivos responsáveis. A
              presença de um link ou anúncio não representa recomendação,
              garantia ou responsabilidade do Kivai pela oferta externa. Avalie
              as condições do terceiro antes de contratar ou fornecer dados.
            </p>
          </TermsSection>

          <TermsSection title="8. Propriedade intelectual">
            <p>
              A marca Kivai, identidade visual, interface, textos autorais,
              organização, código e demais elementos próprios são protegidos
              pela legislação aplicável. Componentes, bibliotecas, marcas e
              conteúdos de terceiros pertencem aos respectivos titulares e
              seguem suas licenças.
            </p>
            <p>
              O uso normal das ferramentas não transfere a você direitos sobre
              o site nem transfere ao Kivai a titularidade de seus arquivos. Não
              é permitido copiar, republicar, vender, licenciar ou explorar os
              elementos protegidos do Kivai fora das permissões legais ou sem
              autorização prévia.
            </p>
          </TermsSection>

          <TermsSection title="9. Relatos de violação">
            <p>
              Se você identificar conteúdo, comportamento ou uso que viole
              direitos, estes Termos ou a legislação, envie uma descrição pela{" "}
              <Link href="/contato">página de contato</Link>. Inclua apenas as
              informações necessárias para localizar e avaliar a situação.
            </p>
          </TermsSection>

          <TermsSection title="10. Privacidade e proteção de dados">
            <p>
              O tratamento de dados pessoais, cookies, consentimento,
              compartilhamentos e direitos dos titulares é detalhado na{" "}
              <Link href="/privacidade">Política de Privacidade</Link>, que
              integra estes Termos. Não inclua dados pessoais sensíveis ou dados
              de terceiros no formulário sem necessidade e autorização.
            </p>
          </TermsSection>

          <TermsSection title="11. Responsabilidades e limites legais">
            <p>
              O Kivai busca fornecer instruções claras e ferramentas funcionais,
              mas você é responsável por conferir entradas, configurações,
              resultados e adequação à finalidade pretendida. Na extensão
              permitida pela legislação, não respondemos por decisões tomadas
              sem validação, perda de arquivos não armazenados, uso ilícito por
              terceiros ou danos decorrentes de fatores fora do nosso controle
              razoável.
            </p>
            <p>
              Nada nestes Termos exclui ou reduz garantias, responsabilidades e
              direitos que não possam ser afastados pela legislação brasileira,
              inclusive os direitos do consumidor quando aplicáveis.
            </p>
          </TermsSection>

          <TermsSection title="12. Medidas em caso de abuso">
            <p>
              Podemos bloquear requisições, limitar funcionalidades ou adotar
              outras medidas técnicas proporcionais quando houver indícios de
              abuso, ataque, fraude, violação destes Termos ou risco à segurança.
              Também poderemos preservar informações e colaborar com autoridades
              quando houver obrigação legal ou ordem válida.
            </p>
          </TermsSection>

          <TermsSection title="13. Alterações destes Termos">
            <p>
              Estes Termos podem ser atualizados para refletir mudanças no site,
              nos serviços ou na legislação. A versão vigente e sua data ficam
              publicadas nesta página. Se uma alteração exigir nova manifestação
              de vontade nos termos da lei, será apresentada de forma apropriada.
            </p>
          </TermsSection>

          <TermsSection title="14. Legislação, solução de dúvidas e contato">
            <p>
              Estes Termos são regidos pela legislação brasileira. Eventuais
              controvérsias serão submetidas ao foro competente definido pela
              legislação aplicável, preservado o foro assegurado ao consumidor
              quando cabível. Antes disso, você pode buscar uma solução pela{" "}
              <Link href="/contato">página de contato</Link>.
            </p>
          </TermsSection>

          <TermsSection title="15. Referências legais">
            <p>
              Os textos oficiais abaixo ajudam a contextualizar direitos e
              deveres aplicáveis ao ambiente digital brasileiro:
            </p>
            <ul className="list-none space-y-3 pl-0">
              {legalReferences.map((reference) => (
                <li key={reference.href}>
                  <a
                    href={reference.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-2"
                  >
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

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-8 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
