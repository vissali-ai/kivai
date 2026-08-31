"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Building2, Check, Copy, Loader2, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

type Partner = {
  nome_socio?: string | null;
  qualificacao_socio?: string | null;
  faixa_etaria?: string | null;
  cnpj_cpf_do_socio?: string | null;
  data_entrada_sociedade?: string | null;
  nome_representante_legal?: string | null;
  qualificacao_representante_legal?: string | null;
};

type SecondaryActivity = {
  codigo?: number | null;
  descricao?: string | null;
};

type TaxRegime = {
  ano?: number | null;
  forma_de_tributacao?: string | null;
  quantidade_de_escrituracoes?: number | null;
};

type Company = {
  uf?: string | null;
  cep?: string | null;
  qsa?: Partner[] | null;
  cnpj?: string | null;
  pais?: string | null;
  email?: string | null;
  porte?: string | null;
  bairro?: string | null;
  numero?: string | null;
  municipio?: string | null;
  logradouro?: string | null;
  cnae_fiscal?: number | null;
  complemento?: string | null;
  codigo_porte?: number | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  capital_social?: number | null;
  ddd_telefone_1?: string | null;
  ddd_telefone_2?: string | null;
  opcao_pelo_mei?: boolean | null;
  descricao_porte?: string | null;
  cnaes_secundarios?: SecondaryActivity[] | null;
  natureza_juridica?: string | null;
  regime_tributario?: TaxRegime[] | null;
  situacao_especial?: string | null;
  opcao_pelo_simples?: boolean | null;
  situacao_cadastral?: number | null;
  data_inicio_atividade?: string | null;
  data_situacao_especial?: string | null;
  data_opcao_pelo_simples?: string | null;
  data_situacao_cadastral?: string | null;
  codigo_natureza_juridica?: number | null;
  data_exclusao_do_simples?: string | null;
  cnae_fiscal_descricao?: string | null;
  data_opcao_pelo_mei?: string | null;
  data_exclusao_do_mei?: string | null;
  motivo_situacao_cadastral?: number | null;
  ente_federativo_responsavel?: string | null;
  identificador_matriz_filial?: number | null;
  qualificacao_do_responsavel?: number | null;
  descricao_situacao_cadastral?: string | null;
  descricao_tipo_de_logradouro?: string | null;
  descricao_motivo_situacao_cadastral?: string | null;
  descricao_identificador_matriz_filial?: string | null;
};

function normalizeCnpj(value: string) {
  return value.toUpperCase().replace(/[.\/-]/g, "").replace(/[^0-9A-Z]/g, "").slice(0, 14);
}

function formatCnpj(value?: string | null) {
  const cnpj = normalizeCnpj(value ?? "");
  if (cnpj.length !== 14) return value || "";
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number") return "Não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPhone(ddd?: string | null, phone?: string | null) {
  const area = (ddd ?? "").replace(/\D/g, "");
  const number = (phone ?? "").replace(/\D/g, "");
  if (!number) return "Não informado";
  const full = area ? `(${area}) ${number}` : number;
  return full;
}

function formatCep(value?: string | null) {
  const cep = (value ?? "").replace(/\D/g, "");
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : value || "Não informado";
}

function display(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "Não informado";
  return String(value);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight">{children}</h2>;
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-border bg-muted/10 p-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function ConsultaDeCnpjClient() {
  const [cnpj, setCnpj] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const normalizedCnpj = useMemo(() => normalizeCnpj(cnpj), [cnpj]);

  function handleChange(value: string) {
    setCnpj(normalizeCnpj(value));
    setError("");
    setCompany(null);
    setCopied(false);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    setCompany(null);
    setCopied(false);

    if (normalizedCnpj.length !== 14) {
      setError("Informe um CNPJ com 14 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/consulta-cnpj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj: normalizedCnpj }),
      });

      const payload = await response.json().catch(() => null) as Company | { error?: string } | null;

      if (!response.ok) {
        setError(payload && "error" in payload && payload.error ? payload.error : "Não foi possível realizar a consulta.");
        return;
      }

      setCompany(payload as Company);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    } catch {
      setError("Não foi possível conectar ao serviço de consulta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!company) return;

    const summary = [
      `Razão Social: ${display(company.razao_social)}`,
      `Nome Fantasia: ${display(company.nome_fantasia)}`,
      `CNPJ: ${formatCnpj(company.cnpj)}`,
      `Situação: ${display(company.descricao_situacao_cadastral)}`,
      `Endereço: ${[company.logradouro, company.numero, company.complemento, company.bairro, company.municipio, company.uf].filter(Boolean).join(", ")}`,
      `CEP: ${formatCep(company.cep)}`,
      `CNAE principal: ${display(company.cnae_fiscal)} - ${display(company.cnae_fiscal_descricao)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar os dados.");
    }
  }

  function reset() {
    setCnpj("");
    setCompany(null);
    setError("");
    setCopied(false);
  }

  return (
    <ToolPageShell
      title="Consulta de CNPJ"
      description="Consulte dados cadastrais, situação, atividades, endereço, contatos e outras informações disponíveis de uma empresa pelo CNPJ."
      categoryName="Empresarial"
      categoryHref="/ferramentas"
      processingMode="server"
      privacyMessage="O CNPJ informado é enviado à BrasilAPI para consulta. O Kivai não salva o resultado da consulta."
    >
      <Card>
        <CardHeader>
          <CardTitle>Consultar empresa</CardTitle>
          <CardDescription>Digite um CNPJ com ou sem pontuação e consulte os dados disponíveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="cnpj" className="text-sm font-medium">CNPJ</label>
              <input
                id="cnpj"
                name="cnpj"
                value={cnpj}
                onChange={(event) => handleChange(event.target.value)}
                inputMode="text"
                autoComplete="off"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                aria-describedby="cnpj-help"
                className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
              <p id="cnpj-help" className="mt-2 text-xs leading-5 text-muted-foreground">
                A consulta aceita CNPJ com ou sem formatação. O formato atual da documentação também contempla caracteres de A a Z.
              </p>
            </div>

            <div className="flex items-end gap-2 sm:shrink-0">
              <Button type="submit" size="lg" disabled={loading || normalizedCnpj.length !== 14}>
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
                {loading ? "Consultando..." : "Consultar CNPJ"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={reset} disabled={loading}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Limpar
              </Button>
            </div>
          </form>

          {error ? (
            <div role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {company ? (
        <div ref={resultRef} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Building2 className="size-4" aria-hidden="true" />
                    <span>Empresa consultada</span>
                  </div>
                  <CardTitle className="mt-2 break-words text-2xl sm:text-3xl">{display(company.razao_social)}</CardTitle>
                  {company.nome_fantasia ? <CardDescription className="mt-1">{company.nome_fantasia}</CardDescription> : null}
                </div>
                <div className="border border-primary/20 bg-primary/5 px-4 py-3 text-center sm:min-w-36">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Situação</p>
                  <p className="mt-1 font-semibold text-primary">{display(company.descricao_situacao_cadastral)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InfoGrid>
                <InfoItem label="CNPJ" value={formatCnpj(company.cnpj)} />
                <InfoItem label="Natureza jurídica" value={display(company.natureza_juridica)} />
                <InfoItem label="Porte" value={display(company.descricao_porte || company.porte)} />
                <InfoItem label="Matriz ou filial" value={display(company.descricao_identificador_matriz_filial)} />
                <InfoItem label="Início da atividade" value={formatDate(company.data_inicio_atividade)} />
                <InfoItem label="Capital social" value={formatMoney(company.capital_social)} />
              </InfoGrid>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copySummary}>
                  {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  {copied ? "Dados principais copiados" : "Copiar dados principais"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-7">
                {[company.descricao_tipo_de_logradouro, company.logradouro, company.numero].filter(Boolean).join(" ")}
                {company.complemento ? `, ${company.complemento}` : ""}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {[company.bairro, company.municipio, company.uf].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 text-sm">CEP: {formatCep(company.cep)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
            <CardContent>
              <InfoGrid>
                <InfoItem label="Telefone 1" value={formatPhone(company.uf === company.uf ? undefined : undefined, company.ddd_telefone_1)} />
                <InfoItem label="Telefone 2" value={formatPhone(undefined, company.ddd_telefone_2)} />
                <InfoItem label="E-mail" value={display(company.email)} />
              </InfoGrid>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Os dados de contato são exibidos somente quando disponibilizados pela fonte consultada.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade econômica principal</CardTitle>
              <CardDescription>CNAE {display(company.cnae_fiscal)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7">{display(company.cnae_fiscal_descricao)}</p>
            </CardContent>
          </Card>

          {company.cnaes_secundarios?.length ? (
            <Card>
              <CardHeader><CardTitle>Atividades econômicas secundárias</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {company.cnaes_secundarios.map((activity, index) => (
                    <div key={`${activity.codigo ?? "activity"}-${index}`} className="border border-border bg-muted/10 p-4">
                      <p className="text-sm font-medium">CNAE {display(activity.codigo)}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{display(activity.descricao)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {company.qsa?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Quadro societário</CardTitle>
                <CardDescription>Informações disponibilizadas pela fonte consultada.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {company.qsa.map((partner, index) => (
                    <div key={`${partner.nome_socio ?? "socio"}-${index}`} className="border border-border bg-muted/10 p-4">
                      <p className="font-medium">{display(partner.nome_socio)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{display(partner.qualificacao_socio)}</p>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        <InfoItem label="Entrada na sociedade" value={formatDate(partner.data_entrada_sociedade)} />
                        <InfoItem label="Faixa etária" value={display(partner.faixa_etaria)} />
                        <InfoItem label="CPF/CNPJ do sócio" value={display(partner.cnpj_cpf_do_socio)} />
                        <InfoItem label="Representante legal" value={display(partner.nome_representante_legal)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {company.regime_tributario?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Regime tributário informado</CardTitle>
                <CardDescription>Histórico disponibilizado pela fonte consultada.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-3 font-medium">Ano</th>
                        <th className="px-3 py-3 font-medium">Forma de tributação</th>
                        <th className="px-3 py-3 font-medium">Escriturações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...company.regime_tributario].sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0)).map((item, index) => (
                        <tr key={`${item.ano ?? "ano"}-${index}`} className="border-b border-border last:border-0">
                          <td className="px-3 py-3">{display(item.ano)}</td>
                          <td className="px-3 py-3">{display(item.forma_de_tributacao)}</td>
                          <td className="px-3 py-3">{display(item.quantidade_de_escrituracoes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle>Situação cadastral</CardTitle></CardHeader>
            <CardContent>
              <InfoGrid>
                <InfoItem label="Situação" value={display(company.descricao_situacao_cadastral)} />
                <InfoItem label="Data da situação" value={formatDate(company.data_situacao_cadastral)} />
                <InfoItem label="Motivo" value={display(company.descricao_motivo_situacao_cadastral)} />
                <InfoItem label="Situação especial" value={display(company.situacao_especial)} />
              </InfoGrid>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Como funciona a consulta?</CardTitle></CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            <p>Digite um CNPJ e clique em consultar. O Kivai encaminha a solicitação para a BrasilAPI e organiza os dados retornados em uma leitura mais simples.</p>
            <p className="mt-3">A resposta depende da disponibilidade e dos campos fornecidos pela fonte no momento da consulta. Campos ausentes ou não informados não são inventados pelo Kivai.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sobre os dados</CardTitle></CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            <p>Os dados apresentados são provenientes da BrasilAPI, que disponibiliza a consulta por CNPJ na API Minha Receita.</p>
            <p className="mt-3">A BrasilAPI orienta que o serviço seja usado de forma responsável, sem crawling, full scan ou consultas automatizadas em loop.</p>
          </CardContent>
        </Card>
      </section>
    </ToolPageShell>
  );
}
