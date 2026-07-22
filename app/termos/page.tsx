import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso | Kivai",
  description:
    "Conheça os Termos de Uso da plataforma Kivai e as condições para utilização dos nossos serviços.",
};

export default function TermosPage() {
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
          Termos de Uso
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Última atualização: Julho de 2026
        </p>

        <div className="mt-10 space-y-10">

          <section>
            <h2 className="text-2xl font-semibold">1. Aceitação dos Termos</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              Ao acessar ou utilizar qualquer serviço disponibilizado pelo
              Kivai, o usuário declara que leu, compreendeu e concorda com os
              presentes Termos de Uso. Caso não concorde com qualquer condição,
              recomenda-se interromper imediatamente a utilização da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Sobre o Kivai</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              O Kivai é uma plataforma online que reúne ferramentas digitais,
              conversores, calculadoras, utilidades para documentos, imagens,
              textos e outras soluções voltadas à produtividade e à otimização
              de tarefas digitais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Utilização da Plataforma</h2>

            <ul className="mt-4 list-disc space-y-3 pl-6 text-muted-foreground">
              <li>Utilizar os serviços apenas para finalidades legais.</li>
              <li>Não tentar comprometer a segurança da plataforma.</li>
              <li>Não utilizar o sistema para atividades ilícitas ou fraudulentas.</li>
              <li>Não copiar, reproduzir ou distribuir partes da plataforma sem autorização.</li>
              <li>Respeitar a legislação vigente durante a utilização dos serviços.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Disponibilidade dos Serviços</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              O Kivai poderá realizar atualizações, melhorias, manutenções ou
              interrupções temporárias de seus serviços sem aviso prévio,
              visando garantir a estabilidade, segurança e evolução da
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Propriedade Intelectual</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              Todo o conteúdo disponibilizado no Kivai, incluindo identidade
              visual, marca, logotipo, interface, códigos, funcionalidades,
              textos e demais elementos da plataforma são protegidos pela
              legislação aplicável e pertencem ao Kivai ou aos respectivos
              titulares.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Limitação de Responsabilidade</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              Embora sejam adotadas boas práticas para oferecer ferramentas
              confiáveis e seguras, o Kivai não garante que todos os resultados
              obtidos sejam livres de erros ou adequados para qualquer finalidade
              específica, cabendo ao usuário validar as informações geradas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Alterações dos Termos</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              Estes Termos de Uso poderão ser alterados a qualquer momento para
              refletir melhorias da plataforma, alterações legais ou novos
              serviços disponibilizados pelo Kivai.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Encerramento de Acesso</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              O Kivai poderá limitar ou interromper o acesso de usuários que
              violem estes Termos de Uso ou pratiquem atividades que coloquem em
              risco a segurança, estabilidade ou funcionamento da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Legislação Aplicável</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              Estes Termos de Uso são regidos pela legislação brasileira,
              observando as normas aplicáveis ao ambiente digital e à proteção
              de dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Contato</h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              Em caso de dúvidas sobre estes Termos de Uso, utilize os canais
              oficiais disponibilizados pelo Kivai.
            </p>
          </section>

        </div>

      </div>
    </main>
  );
}