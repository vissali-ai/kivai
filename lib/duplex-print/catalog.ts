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

export const duplexEditorial = `<h2>Como imprimir frente e verso em PDF</h2><p>Escolha seu PDF e informe a impressora. O arquivo é processado no seu navegador. Para equipamentos com duplex automático, abra o PDF e ative a impressão nos dois lados na janela do sistema.</p><h2>Imprimir frente e verso manualmente</h2><p>Uma impressora sem duplex pode imprimir as frentes e, depois de recolocar as folhas, os versos. Faça o teste de orientação e o teste com duas folhas para confirmar a ordem. Baixe os dois arquivos e imprima cada um uma única vez, com uma página por folha, uma cópia e duplex desativado.</p><h2>Como virar a folha</h2><p>A face impressa, o topo e a ordem da pilha variam conforme a bandeja e o equipamento. Repita exatamente o movimento validado no teste. Não existe uma posição universal para todas as impressoras.</p><h2>Borda longa ou curta?</h2><p>Borda longa abre como um livro em páginas em retrato. Borda curta abre como um calendário em retrato. Em paisagem, a relação visual se inverte. No modo manual, confirme a borda escolhida com as folhas de teste.</p><h2>Quantidade ímpar de páginas</h2><p>O arquivo dos versos inclui uma página em branco quando necessário para preservar os pares. Desative a opção de pular páginas em branco. A sequência pode ser invertida conforme o resultado do teste da pilha.</p><h2>Limites e privacidade</h2><p>PDFs de até 50 MB e 500 páginas. Arquivos protegidos por senha, inválidos ou sem páginas não são aceitos. Documentos com tamanhos ou orientações diferentes devem ser separados em grupos antes da impressão manual. O navegador não detecta nem configura sua impressora. No celular, baixe o PDF e abra-o em um aplicativo com suporte à impressão.</p>`;
