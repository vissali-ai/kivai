import type { PageOrientation, PageSize } from "./config";

export type DocxValidationResult = { pageCount: number };

function docxError(message: string) {
  return new Error(message);
}

export async function validateAndRenderDocx(file: File, container: HTMLElement): Promise<DocxValidationResult> {
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) throw docxError("invalid-docx");

  const { default: JSZip } = await import("jszip");
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw docxError("corrupt-docx");
  }
  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) throw docxError("invalid-docx");
  if (zip.file("EncryptedPackage") || zip.file("EncryptionInfo")) throw docxError("protected-docx");
  if (zip.file("word/vbaProject.bin")) throw docxError("macro-docx");

  container.replaceChildren();
  const { renderAsync } = await import("docx-preview");
  try {
    await renderAsync(await file.arrayBuffer(), container, undefined, {
      className: "kivai-docx",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      useBase64URL: true,
    });
  } catch {
    container.replaceChildren();
    throw docxError("corrupt-docx");
  }

  container.querySelectorAll("a").forEach((anchor) => {
    anchor.removeAttribute("href");
    anchor.removeAttribute("target");
  });
  container.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    if (!/^(data:|blob:)/i.test(image.src)) image.remove();
  });
  container.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (/url\(["']?https?:/i.test(element.style.backgroundImage)) element.style.backgroundImage = "none";
  });
  const pages = getRenderedPages(container);
  if (!pages.length) throw docxError("empty-docx");
  const pageCount = pages.filter(hasPageContent).reduce((total, page) => {
    const width = Math.max(page.scrollWidth, page.offsetWidth, 816);
    const height = Math.max(page.scrollHeight, page.offsetHeight, 1);
    return total + Math.max(1, Math.ceil(height / (width * (1056 / 816))));
  }, 0);
  return { pageCount: pageCount || pages.length };
}

function getRenderedPages(container: HTMLElement): HTMLElement[] {
  const sections = Array.from(container.querySelectorAll<HTMLElement>(".docx-wrapper > section"));
  return sections.length ? sections : Array.from(container.children).filter((item): item is HTMLElement => item instanceof HTMLElement);
}

function hasPageContent(page: HTMLElement): boolean {
  const article = page.querySelector("article") ?? page;
  return Boolean(article.textContent?.trim() || article.querySelector("img, svg, table, canvas"));
}

function canvasHasVisibleContent(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return true;
  try {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixelCount = canvas.width * canvas.height;
    const stride = Math.max(1, Math.floor(Math.sqrt(pixelCount / 120_000)));
    let inspected = 0;
    let visible = 0;
    for (let y = 0; y < canvas.height; y += stride) {
      for (let x = 0; x < canvas.width; x += stride) {
        const offset = (y * canvas.width + x) * 4;
        inspected++;
        if (pixels[offset + 3] > 8 && (pixels[offset] < 245 || pixels[offset + 1] < 245 || pixels[offset + 2] < 245)) {
          visible++;
          if (visible >= Math.max(4, Math.ceil(inspected * 0.0002))) return true;
        }
      }
    }
    return false;
  } catch {
    // Um canvas protegido pelo navegador não pode ter pixels inspecionados;
    // nesse caso, mantemos a página para não descartar conteúdo legítimo.
    return true;
  }
}

export async function renderDocxToPdf(
  container: HTMLElement,
  options: { orientation: PageOrientation; pageSize: PageSize },
  onStage: (stage: string) => void,
): Promise<Blob> {
  const pages = getRenderedPages(container).filter(hasPageContent);
  if (!pages.length) throw docxError("empty-docx");
  onStage("Preparando o conteúdo");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  let pdf: InstanceType<typeof jsPDF> | null = null;
  const fallbackIsLandscape = options.orientation === "landscape";
  const fallbackSize = options.pageSize === "a4"
    ? { width: 794, height: 1123 }
    : { width: 816, height: 1056 };
  const fallbackWidth = fallbackIsLandscape ? fallbackSize.height : fallbackSize.width;
  const fallbackHeight = fallbackIsLandscape ? fallbackSize.width : fallbackSize.height;

  function appendCanvasPage(canvas: HTMLCanvasElement, logicalHeight = canvas.height) {
    const resolvedOrientation = options.orientation === "auto"
      ? (fallbackWidth > fallbackHeight ? "landscape" : "portrait")
      : options.orientation;
    const format: string | [number, number] = options.pageSize === "auto"
      ? [canvas.width * 0.75, logicalHeight * 0.75]
      : options.pageSize === "letter" ? "letter" : "a4";
    if (!pdf) pdf = new jsPDF({ orientation: resolvedOrientation, unit: "pt", format, compress: true });
    else pdf.addPage(format, resolvedOrientation);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / logicalHeight);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", (pageWidth - width) / 2, 0, width, height, undefined, "FAST");
  }

  for (let index = 0; index < pages.length; index++) {
    onStage(index === pages.length - 1 ? "Finalizando o arquivo" : `Gerando o PDF · página ${index + 1} de ${pages.length}`);
    const sourcePage = pages[index];
    const sourceStyle = window.getComputedStyle(sourcePage);
    const sourceRect = sourcePage.getBoundingClientRect();
    const parsedStyleWidth = Number.parseFloat(sourceStyle.width);
    const parsedStyleHeight = Number.parseFloat(sourceStyle.height);
    const measuredWidth = sourcePage.offsetWidth
      || Math.ceil(sourceRect.width)
      || (Number.isFinite(parsedStyleWidth) ? Math.ceil(parsedStyleWidth) : 0)
      || sourcePage.scrollWidth;
    const article = sourcePage.querySelector<HTMLElement>("article");
    const paddingTop = Number.parseFloat(sourceStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(sourceStyle.paddingBottom) || 0;
    const articleHeight = article
      ? Math.max(article.scrollHeight, article.offsetHeight, Math.ceil(article.getBoundingClientRect().height)) + paddingTop + paddingBottom
      : 0;
    const measuredHeight = Math.max(
      sourcePage.scrollHeight,
      sourcePage.offsetHeight,
      Math.ceil(sourceRect.height),
      Number.isFinite(parsedStyleHeight) ? Math.ceil(parsedStyleHeight) : 0,
      Math.ceil(articleHeight),
    );
    const captureWidth = measuredWidth || fallbackWidth;
    const captureHeight = measuredHeight || fallbackHeight;

    const canvas = await html2canvas(sourcePage, {
        backgroundColor: "#ffffff",
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        logging: false,
        imageTimeout: 15_000,
        onclone: (clonedDocument) => {
        // html2canvas 1.x não interpreta oklch(), usado pelo tema do Kivai.
        // A prévia do Word usa cores próprias, então substituímos apenas os
        // tokens herdados da interface dentro da cópia temporária.
        const root = clonedDocument.documentElement;
        const safeColors: Record<string, string> = {
          "--background": "#ffffff",
          "--foreground": "#111827",
          "--card": "#ffffff",
          "--card-foreground": "#111827",
          "--popover": "#ffffff",
          "--popover-foreground": "#111827",
          "--primary": "#4f46e5",
          "--primary-foreground": "#ffffff",
          "--secondary": "#f3f4f6",
          "--secondary-foreground": "#111827",
          "--muted": "#f3f4f6",
          "--muted-foreground": "#6b7280",
          "--accent": "#f3f4f6",
          "--accent-foreground": "#111827",
          "--destructive": "#dc2626",
          "--border": "#d1d5db",
          "--input": "#d1d5db",
          "--ring": "#4f46e5",
        };
        Object.entries(safeColors).forEach(([name, value]) => root.style.setProperty(name, value));
        clonedDocument.body.style.backgroundColor = "#ffffff";
        clonedDocument.body.style.color = "#111827";
        clonedDocument.querySelectorAll<HTMLElement>(".docx-wrapper").forEach((element) => {
          element.style.backgroundColor = "#ffffff";
        });
        clonedDocument.querySelectorAll<HTMLElement>(".docx-wrapper > section").forEach((element) => {
          element.style.backgroundColor = "#ffffff";
          element.style.overflow = "visible";
          element.style.height = `${captureHeight}px`;
          element.style.minHeight = `${captureHeight}px`;
          element.style.boxShadow = "none";
        });
        },
      });
    if (!canvas.width || !canvas.height) throw docxError("render-failed");
    if (!canvasHasVisibleContent(canvas)) {
      canvas.width = 1;
      canvas.height = 1;
      continue;
    }
    const segmentHeight = Math.max(1, Math.round(canvas.width * (fallbackHeight / fallbackWidth)));
    if (canvas.height <= segmentHeight * 1.08) {
      appendCanvasPage(canvas, segmentHeight);
    } else {
      for (let offset = 0; offset < canvas.height; offset += segmentHeight) {
        const sliceHeight = Math.min(segmentHeight, canvas.height - offset);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = segmentHeight;
        const context = slice.getContext("2d");
        if (!context) throw docxError("render-failed");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, slice.width, slice.height);
        context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        appendCanvasPage(slice, segmentHeight);
        slice.width = 1;
        slice.height = 1;
      }
    }
    canvas.width = 1;
    canvas.height = 1;
  }
  if (!pdf) throw docxError("render-failed");
  return (pdf as InstanceType<typeof jsPDF>).output("blob");
}
