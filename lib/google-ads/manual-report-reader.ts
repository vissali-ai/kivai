/**
 * Converte exports manuais Google Ads em trechos de tabela legíveis para IA.
 * Só texto; nenhum documento é enviado até o usuário confirmar.
 * Limite beta de 12 mil caracteres por relatório para limitar custo.
 */
function excelValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value) return excelValue(value.result);
    if ("text" in value) return excelValue(value.text);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part: { text?: string }) => part.text ?? "").join("");
    }
  }
  return "";
}

export async function readTrafficManualReport(file: File): Promise<{
  content: string;
  truncated: boolean;
}> {
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("O relatório beta deve ter até 3 MB. Exporte uma seleção mais específica.");
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["csv", "tsv", "txt", "xlsx"].includes(extension ?? "")) {
    throw new Error("Use um relatório CSV, TSV, TXT ou Excel (.xlsx).");
  }

  let text = "";
  let truncated = false;
  if (extension === "xlsx") {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      new Uint8Array(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    for (const sheet of workbook.worksheets.slice(0, 2)) {
      let seen = 0;
      text += "ABA: " + sheet.name.slice(0, 60) + "\n";
      sheet.eachRow({ includeEmpty: false }, (row) => {
        if (seen >= 150 || text.length > 13_000) { truncated = true; return; }
        const cells: string[] = [];
        for (let index = 1; index <= Math.min(20, row.cellCount); index++) {
          cells.push(excelValue(row.getCell(index).value).slice(0, 140));
        }
        text += "Linha " + (seen + 1) + ": " + cells.join(" | ") + "\n";
        seen++;
      });
    }
  } else {
    text = await file.text();
  }
  if (!text.trim()) throw new Error("O arquivo está vazio ou não contém dados legíveis.");
  const cap = 11_800;
  const cleaned = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email ocultado]")
    .replace(/\b(?:\+?55[\s().-]*)?(?:\(?\d{2}\)?[\s().-]*)?9?\d{4}[\s.-]?\d{4}\b/g, "[telefone ocultado]");
  return { content: cleaned.slice(0, cap), truncated: truncated || cleaned.length > cap };
}
