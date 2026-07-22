import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | Kivai",
  description:
    "Conheça como o Kivai coleta, utiliza e protege as informações dos usuários.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
<div className="mb-8">
  <Link
    href="/"
    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-foreground"
  >
    <ArrowLeft className="h-4 w-4" />
    Voltar para a página inicial
  </Link>
</div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Documento Oficial
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight">
          Política de Privacidade
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Última atualização: Julho de 2026
        </p>

        <div className="mt-10 space-y-10">

          <section>
            <h2 className="text-2xl font-semibold">1. Nosso compromisso</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              O Kivai respeita a privacidade de todos os usuários e está
              comprometido com a proteção dos dados pessoais tratados em sua
              plataforma. Esta Política explica quais informações podem ser
              coletadas, como são utilizadas e quais são os direitos dos
              usuários.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Dados que podem ser coletados</h2>

            <ul className="mt-4 list-disc space-y-3 pl-6 text-muted-foreground">
              <li>Informações fornecidas voluntariamente pelo usuário.</li>
              <li>Dados técnicos do navegador e dispositivo.</li>
              <li>Endereço IP e informações de acesso.</li>
              <li>Cookies e tecnologias semelhantes.</li>
              <li>Dados estatísticos e de utilização das ferramentas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Finalidade da coleta</h2>

            <ul className="mt-4 list-disc space-y-3 pl-6 text-muted-foreground">
              <li>Melhorar a experiência dos usuários.</li>
              <li>Garantir o funcionamento da plataforma.</li>
              <li>Corrigir erros e desenvolver novos recursos.</li>
              <li>Realizar análises de desempenho.</li>
              <li>Prevenir fraudes e proteger o sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Cookies</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              O Kivai utiliza cookies para melhorar a navegação, manter
              funcionalidades essenciais e compreender como a plataforma é
              utilizada. O usuário poderá gerenciar os cookies diretamente em
              seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Ferramentas de análise</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              Podemos utilizar serviços como Google Analytics para obter
              informações estatísticas sobre o uso da plataforma. Esses dados
              são utilizados apenas para melhoria contínua dos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Compartilhamento de informações</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              O Kivai não comercializa dados pessoais dos usuários. O
              compartilhamento poderá ocorrer apenas quando necessário para o
              funcionamento dos serviços, cumprimento de obrigações legais ou
              proteção dos direitos da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Segurança</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              Adotamos medidas técnicas e administrativas para proteger as
              informações contra acessos não autorizados, alterações,
              divulgação ou destruição indevida.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Direitos do usuário</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              Sempre que aplicável, o usuário poderá solicitar acesso,
              atualização, correção ou exclusão de seus dados pessoais, nos
              termos da legislação vigente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Alterações desta Política</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              Esta Política poderá ser atualizada periodicamente para refletir
              melhorias na plataforma ou alterações legais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Contato</h2>

            <p className="mt-4 text-muted-foreground leading-8">
              Em caso de dúvidas sobre esta Política de Privacidade, utilize os
              canais oficiais de contato disponibilizados pelo Kivai.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:border-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página inicial
          </Link>
        </div>

      </div>
    </main>
  );
}