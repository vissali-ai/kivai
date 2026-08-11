import { HTML_TO_PDF_MAX_ELEMENTS, type PdfOptions } from "./config";

export function sanitizeHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script,iframe,object,embed,applet,base,form,meta[http-equiv],link").forEach((element) => element.remove());
  document.querySelectorAll("*").forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.replace(/\s/g, "");
      if (name.startsWith("on") || name === "srcdoc" || (["href", "src", "action"].includes(name) && /^(javascript|vbscript|file):/i.test(value))) {
        element.removeAttribute(attribute.name);
      }
      if (name === "style" && /expression\(|javascript:/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
}

export function validateHtml(html: string) {
  if (!html.trim()) throw new Error("empty-html");
  if (new Blob([html]).size > 5_242_880) throw new Error("too-large");
  const document = new DOMParser().parseFromString(html, "text/html");
  if (document.querySelectorAll("*").length > HTML_TO_PDF_MAX_ELEMENTS) throw new Error("too-large");
  if (!document.body.textContent?.trim() && !document.body.querySelector("img,table,svg")) throw new Error("invalid-html");
  return sanitizeHtml(html);
}

const preset = { none: 0, small: 5, normal: 10, large: 20 } as const;

export async function renderHtmlToPdf(container: HTMLElement, options: PdfOptions, stage: (message: string) => void) {
  stage("Preparando conteúdo");
  const html = container.querySelector<HTMLIFrameElement>("iframe")?.srcdoc || "";
  const margin = options.margin === "custom"
    ? options.customMargins
    : [preset[options.margin], preset[options.margin], preset[options.margin], preset[options.margin]];

  stage("Renderizando página");
  const response = await fetch("/api/html-to-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html,
      page_size: options.pageSize === "letter" ? "Letter" : options.pageSize === "legal" ? "Legal" : options.pageSize.toUpperCase(),
      landscape: options.orientation === "landscape",
      margins: { top: margin[0], bottom: margin[1], left: margin[2], right: margin[3] },
      scale: options.scale === "auto" ? 1 : Number(options.scale),
      header: options.header,
      footer: options.footer,
      page_numbers: options.pageNumbers,
    }),
  });
  if (!response.ok) {
    if (response.status === 413) throw new Error("too-large");
    throw new Error("render-failed");
  }

  stage("Gerando PDF");
  const blob = await response.blob();
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
  const pages = pdf.numPages;
  await pdf.cleanup();
  stage("Finalizando arquivo");
  return { blob, pages };
}
