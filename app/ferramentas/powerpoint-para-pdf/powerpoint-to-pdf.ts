import type { PptxViewer } from "@aiden0z/pptx-renderer";

import type { PageOrientation, PageSize, RenderQuality } from "./config";
import { POWERPOINT_TO_PDF_MAX_SLIDES } from "./config";

export type PowerPointSlidePreview = {
  slideNumber: number;
  thumbnailUrl: string;
};

export type InspectedPowerPoint = {
  viewer: PptxViewer;
  host: HTMLElement;
  slideCount: number;
  slideWidth: number;
  slideHeight: number;
  previews: PowerPointSlidePreview[];
};

function pptxError(code: string) {
  return new Error(code);
}

function createRenderHost(width = 1280) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: `${width}px`,
    overflow: "hidden",
    pointerEvents: "none",
    background: "#ffffff",
  });
  document.body.appendChild(host);
  return host;
}

async function validatePptxPackage(file: File) {
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) throw pptxError("invalid-pptx");

  const { default: JSZip } = await import("jszip");
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw pptxError("corrupt-pptx");
  }

  if (zip.file("EncryptedPackage") || zip.file("EncryptionInfo")) throw pptxError("protected-pptx");
  if (!zip.file("[Content_Types].xml") || !zip.file("ppt/presentation.xml")) throw pptxError("invalid-pptx");

  const slideCount = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path)).length;
  if (!slideCount) throw pptxError("empty-pptx");
  if (slideCount > POWERPOINT_TO_PDF_MAX_SLIDES) throw pptxError("too-many-slides");
}

async function renderElementToBlob(element: HTMLElement, quality: RenderQuality, thumbnail = false) {
  const { toJpeg } = await import("html-to-image");
  const pixelRatio = thumbnail ? 0.5 : quality === "high" ? 2 : 1.35;
  const dataUrl = await toJpeg(element, {
    backgroundColor: "#ffffff",
    cacheBust: false,
    pixelRatio,
    quality: thumbnail ? 0.78 : quality === "high" ? 0.96 : 0.9,
    skipAutoScale: false,
  });
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!blob.size) throw pptxError("render-failed");
  return blob;
}

export async function inspectPowerPoint(
  file: File,
  onStage: (stage: string) => void,
): Promise<InspectedPowerPoint> {
  onStage("Lendo apresentação");
  await validatePptxPackage(file);
  const host = createRenderHost();
  const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import("@aiden0z/pptx-renderer/browser");
  let viewer: PptxViewer | null = null;

  try {
    viewer = new PptxViewer(host, {
      fitMode: "none",
      zipLimits: RECOMMENDED_ZIP_LIMITS,
      lazyMedia: true,
      pdfjs: false,
    });
    await viewer.open(await file.arrayBuffer(), { renderMode: "slide", lazyMedia: true });
    if (!viewer.slideCount) throw pptxError("empty-pptx");
    if (viewer.slideCount > POWERPOINT_TO_PDF_MAX_SLIDES) throw pptxError("too-many-slides");

    const previews: PowerPointSlidePreview[] = [];
    onStage("Processando slides");
    for (let index = 0; index < viewer.slideCount; index++) {
      const target = document.createElement("div");
      target.style.width = `${viewer.slideWidth}px`;
      host.appendChild(target);
      const handle = viewer.renderSlideToContainer(index, target, 1);
      if (!handle) throw pptxError("render-failed");
      await handle.ready;
      const blob = await renderElementToBlob(handle.element, "standard", true);
      previews.push({ slideNumber: index + 1, thumbnailUrl: URL.createObjectURL(blob) });
      handle.dispose();
      target.remove();
    }

    return {
      viewer,
      host,
      slideCount: viewer.slideCount,
      slideWidth: viewer.slideWidth,
      slideHeight: viewer.slideHeight,
      previews,
    };
  } catch (error) {
    viewer?.destroy();
    host.remove();
    if (error instanceof Error && /password|encrypt/i.test(error.message)) throw pptxError("protected-pptx");
    if (error instanceof Error && ["invalid-pptx", "corrupt-pptx", "protected-pptx", "empty-pptx", "too-many-slides", "render-failed"].includes(error.message)) throw error;
    throw pptxError("corrupt-pptx");
  }
}

export function disposePowerPoint(inspected: InspectedPowerPoint | null) {
  if (!inspected) return;
  inspected.previews.forEach((preview) => URL.revokeObjectURL(preview.thumbnailUrl));
  inspected.viewer.destroy();
  inspected.host.remove();
}

function pageFormat(
  pageSize: PageSize,
  orientation: PageOrientation,
  slideWidth: number,
  slideHeight: number,
) {
  const naturalLandscape = slideWidth >= slideHeight;
  const landscape = orientation === "auto" ? naturalLandscape : orientation === "landscape";
  if (pageSize === "auto") {
    const width = slideWidth * 0.75;
    const height = slideHeight * 0.75;
    return { format: [width, height] as [number, number], orientation: width >= height ? "landscape" as const : "portrait" as const };
  }
  return { format: pageSize === "letter" ? "letter" : "a4", orientation: landscape ? "landscape" as const : "portrait" as const };
}

export async function convertPowerPointToPdf(
  inspected: InspectedPowerPoint,
  slideOrder: number[],
  options: { orientation: PageOrientation; pageSize: PageSize; quality: RenderQuality },
  onStage: (stage: string) => void,
): Promise<Blob> {
  if (!slideOrder.length) throw pptxError("no-slides");
  const { jsPDF } = await import("jspdf");
  const page = pageFormat(options.pageSize, options.orientation, inspected.slideWidth, inspected.slideHeight);
  let pdf: InstanceType<typeof jsPDF> | null = null;
  const host = createRenderHost(inspected.slideWidth);

  try {
    onStage("Processando slides");
    for (let index = 0; index < slideOrder.length; index++) {
      const target = document.createElement("div");
      target.style.width = `${inspected.slideWidth}px`;
      host.appendChild(target);
      const handle = inspected.viewer.renderSlideToContainer(slideOrder[index] - 1, target, 1);
      if (!handle) throw pptxError("render-failed");
      await handle.ready;
      const image = await renderElementToBlob(handle.element, options.quality);
      handle.dispose();
      target.remove();

      onStage(index === slideOrder.length - 1 ? "Gerando PDF" : "Processando slides");
      if (!pdf) pdf = new jsPDF({ unit: "pt", format: page.format, orientation: page.orientation, compress: true });
      else pdf.addPage(page.format, page.orientation);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const slideRatio = inspected.slideWidth / inspected.slideHeight;
      const width = Math.min(pageWidth, pageHeight * slideRatio);
      const height = width / slideRatio;
      pdf.addImage(new Uint8Array(await image.arrayBuffer()), "JPEG", (pageWidth - width) / 2, (pageHeight - height) / 2, width, height, undefined, "FAST");
    }
    if (!pdf) throw pptxError("render-failed");
    onStage("Finalizando arquivo");
    return pdf.output("blob");
  } finally {
    host.remove();
  }
}
