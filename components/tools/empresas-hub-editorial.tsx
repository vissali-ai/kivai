export function EmpresasHubEditorial() {
  return (
    <section aria-labelledby="empresas-editorial-title" className="border-t border-border bg-muted/10 py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Guia de consultas empresariais</p>
        <h2 id="empresas-editorial-title" className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight">
          Ferramentas para consultar informações de empresas e operações comerciais
        </h2>

        <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
          <p>
            Consultas empresariais atendem necessidades diferentes. O CNPJ identifica e reúne informações cadastrais de uma pessoa jurídica; o CNAE ajuda a entender a atividade econômica; o NCM é usado na classificação de mercadorias; a consulta de banco auxilia na identificação de instituições financeiras; e o verificador de domínio .BR apresenta informações públicas sobre domínios.
          </p>
          <p>
            O resultado de uma consulta depende da fonte utilizada e da atualização dos dados disponíveis. Por isso, as ferramentas do Kivai devem ser usadas como apoio para pesquisa e conferência, sem substituir documentos oficiais ou obrigações de órgãos públicos.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Dados da empresa</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use a Consulta de CNPJ para conferir dados cadastrais e a Consulta de CNAE para identificar a classificação da atividade econômica.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Comércio e financeiro</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A Consulta de NCM apoia pesquisas de classificação de mercadorias, enquanto a Consulta de Banco ajuda a identificar instituições pelo código bancário.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Presença digital</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              O Verificador de Domínio .BR permite consultar informações públicas de domínios com final .br antes de registrar, acompanhar ou validar um endereço.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Fluxo recomendado</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Defina exatamente qual informação precisa confirmar.</li>
              <li>Escolha a consulta correspondente e informe somente os dados necessários.</li>
              <li>Compare o resultado com a fonte oficial quando a decisão exigir confirmação formal.</li>
              <li>Guarde documentos oficiais quando a informação fizer parte de um processo fiscal, jurídico ou comercial.</li>
            </ol>
          </article>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Atualização e responsabilidade</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Informações públicas podem mudar e uma API pode ter indisponibilidade ou limites de consulta. O Kivai apresenta os dados retornados pela fonte e não garante que uma consulta substitua registros, certidões ou documentos emitidos pela autoridade competente.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
