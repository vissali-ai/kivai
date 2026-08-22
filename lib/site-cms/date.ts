const siteEditDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSiteEditDate(value: string) {
  if (!value) return "Ainda não editado pelo painel";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não disponível" : siteEditDate.format(date);
}
