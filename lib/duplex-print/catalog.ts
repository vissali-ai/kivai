import { z } from "zod";

export const printerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(100),
  brand: z.enum(["Epson", "HP", "Canon", "Brother"]),
  model: z.string().min(1).max(120),
  duplex: z.enum(["yes", "no", "unknown"]),
  status: z.enum(["confirmed", "unconfirmed"]),
  source: z.string().max(1000).refine(v => !v || /^https:\/\//.test(v), "Use uma fonte HTTPS."),
  tray: z.string().max(500),
  output: z.string().max(500),
  firstPass: z.string().max(1000),
  reinsertion: z.string().max(2000),
  edge: z.enum(["long", "short"]),
  notes: z.string().max(2000),
  tutorialUrl: z.string().max(1000).refine(v => !v || /^https:\/\//.test(v)),
}).refine(v => v.duplex === "unknown" || Boolean(v.source), "Informe a fonte para a capacidade duplex.")
  .refine(v => v.status !== "confirmed" || Boolean(v.source && v.tray && v.firstPass && v.reinsertion), "Instruções confirmadas exigem fonte, bandeja, primeira impressão e reinserção.");
export const printersSchema = z.array(printerSchema).max(1000).refine(v => new Set(v.map(p => p.id)).size === v.length, "IDs de modelos devem ser únicos.");
export type Printer = z.infer<typeof printerSchema>;
export const defaultPrinters: Printer[] = [
  ["Epson", "L3250"], ["HP", "DeskJet 2774"], ["Canon", "G3110"], ["Brother", "DCP-T420W"],
].map(([brand, model]) => ({ id: `${brand}-${model}`.toLowerCase().replaceAll(" ", "-"), brand: brand as Printer["brand"], model, duplex: "unknown", status: "unconfirmed", source: "", tray: "", output: "", firstPass: "", reinsertion: "", edge: "long", notes: "Orientação ainda não verificada. Faça os testes antes de imprimir o documento.", tutorialUrl: "" }));

// Capability verified separately from physical reinsertion instructions (2026-10-03).
defaultPrinters[0] = { ...defaultPrinters[0], duplex: "no", source: "https://epson.com.br/faq/SPT_C11CJ67301~faq-0000803-l3250_l3251?faq_cat=faq-topFaqs" };
defaultPrinters[1] = { ...defaultPrinters[1], duplex: "no", source: "https://h20195.www2.hp.com/v2/GetPDF.aspx/c08017671.pdf" };
defaultPrinters.push({ ...defaultPrinters[3], id: "brother-dcp-t720dw", model: "DCP-T720DW", duplex: "yes", source: "https://www.brother.com.br/products/DCPT720DW", notes: "Duplex automático confirmado pelo fabricante. Para usar a reinserção manual, faça os testes de orientação e ordem." });
defaultPrinters.push({
  id: "brother-mfc-490cw", brand: "Brother", model: "MFC-490CW", duplex: "no", status: "confirmed",
  source: "https://support.brother.com/g/b/faqend.aspx?c=gb&faqid=faq00000073_017&lang=en&prod=mfc490cw_all",
  tray: "Bandeja de papel; remova as folhas não impressas antes de recolocar a pilha.",
  output: "Retire as folhas da bandeja de saída e espere a tinta secar.",
  firstPass: "Referência do fabricante para o PDF original no Windows: imprimir páginas ímpares em ordem inversa. Para os arquivos preparados pelo KIVAI, use todas as páginas e ordem normal, conforme o teste abaixo.",
  reinsertion: "Recoloque as folhas planas com a face impressa para cima. Em retrato, o topo das imagens fica no fundo da bandeja; em paisagem, à direita. No procedimento do fabricante para Windows, a segunda passagem usa páginas pares em ordem normal. Nos arquivos KIVAI, siga a sequência já preparada após os testes.",
  edge: "long", notes: "A sequência do manual varia entre Windows e Macintosh. Não combine os filtros do driver com os PDFs separados do KIVAI. Confirme a borda e a bandeja com os testes.", tutorialUrl: "",
});

export function readPrinters(value: unknown): Printer[] {
  if (value === undefined) return defaultPrinters;
  const parsed = printersSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export const duplexEditorial = `<h2>Como preparar um PDF para imprimir frente e verso</h2><p>Envie um PDF. A ferramenta trabalha localmente no navegador e não envia o documento para um servidor. Escolha se sua impressora faz duplex automático ou se você precisa virar as folhas manualmente.</p><h2>Impressora com duplex automático</h2><p>Baixe o PDF original, abra-o em um leitor e ative “Imprimir nos dois lados”. Escolha borda longa para abrir como livro ou borda curta para abrir como calendário.</p><h2>Impressão manual</h2><p>A ferramenta prepara um PDF com as páginas da frente e outro com as páginas do verso. Imprima as frentes primeiro, recoloque a pilha na bandeja sem mudar a ordem e imprima os versos. A posição de recolocar o papel varia por impressora: faça um teste com poucas páginas antes do documento completo. Se as folhas saírem na ordem inversa ou o verso ficar de cabeça para baixo, abra “Ajustar à minha impressora” e marque a correção correspondente.</p><h2>Quantidade ímpar de páginas</h2><p>Quando o PDF tem um número ímpar de páginas, o arquivo de versos recebe uma página em branco no final para manter a correspondência das folhas.</p><h2>Limites e privacidade</h2><p>São aceitos PDFs válidos de até 50 MB e 500 páginas. Arquivos protegidos por senha ou corrompidos não são aceitos. O navegador não detecta nem configura sua impressora. No celular, abra o PDF baixado em um aplicativo com suporte à impressão.</p>`;
