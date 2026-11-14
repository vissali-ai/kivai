const button = document.querySelector("#capture");
const status = document.querySelector("#status");
const progress = document.querySelector("#progress");
const OVERLAP = 120;
const MAX_PIXELS = 50_000_000;
const MAX_CANVAS_DIMENSION = 32_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runInTab(tabId, func, args = []) {
  const [result] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return result?.result;
}

function imageFromDataUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível decodificar um frame da página."));
    image.src = url;
  });
}

function resizeCanvas(canvas, height) {
  const nextHeight = Math.ceil(height);
  if (nextHeight <= canvas.height) return canvas;
  if (canvas.width * nextHeight > MAX_PIXELS || nextHeight > MAX_CANVAS_DIMENSION) {
    throw new Error("Esta página é grande demais para virar uma única imagem. Tente reduzir o zoom do navegador e capturar novamente.");
  }
  const previous = document.createElement("canvas");
  previous.width = canvas.width;
  previous.height = canvas.height;
  previous.getContext("2d").drawImage(canvas, 0, 0);
  canvas.height = nextHeight;
  canvas.getContext("2d").drawImage(previous, 0, 0);
  return canvas;
}

function safeFilename(title) {
  const clean = (title || "pagina").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
  return `${clean || "pagina"}-captura-completa.png`;
}

async function capturePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.windowId) throw new Error("Não encontrei a aba ativa para capturar.");
  if (!/^https?:\/\//i.test(tab.url || "")) {
    throw new Error("Abra uma página web (http ou https) e tente novamente.");
  }

  const start = await runInTab(tab.id, () => {
    const root = document.documentElement;
    const body = document.body;
    const width = window.innerWidth;
    const height = Math.max(root.scrollHeight, body?.scrollHeight || 0, window.innerHeight);
    const oldBehavior = root.style.scrollBehavior;
    const x = window.scrollX;
    const y = window.scrollY;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    return { width, height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, x, y, oldBehavior, title: document.title };
  });
  if (!start?.viewportWidth || !start?.viewportHeight) throw new Error("Não consegui medir a página.");

  let canvas;
  let context;
  let scale = 0;
  let finished = false;
  try {
    const firstFrame = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const firstImage = await imageFromDataUrl(firstFrame);
    scale = firstImage.width / start.viewportWidth;
    const outputWidth = Math.ceil(start.width * scale);
    const outputHeight = Math.ceil(start.height * scale);
    if (outputWidth * outputHeight > MAX_PIXELS || outputWidth > MAX_CANVAS_DIMENSION || outputHeight > MAX_CANVAS_DIMENSION) {
      throw new Error("Esta página é grande demais para virar uma única imagem. Tente reduzir o zoom do navegador e capturar novamente.");
    }
    canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    context = canvas.getContext("2d");
    if (!context) throw new Error("O navegador não conseguiu preparar a imagem final.");
    context.drawImage(firstImage, 0, 0);

    const step = Math.max(1, start.viewportHeight - OVERLAP);
    let pageHeight = start.height;
    let previousScroll = 0;
    let frameIndex = 1;

    while (previousScroll + start.viewportHeight < pageHeight) {
      const desired = Math.min(previousScroll + step, pageHeight - start.viewportHeight);
      const current = await runInTab(tab.id, (y) => {
        window.scrollTo({ top: y, left: 0, behavior: "instant" });
        return window.scrollY;
      }, [desired]);
      if (typeof current !== "number" || current <= previousScroll) break;
      await sleep(520);
      pageHeight = await runInTab(tab.id, () => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0, window.innerHeight)) || pageHeight;
      canvas = resizeCanvas(canvas, pageHeight * scale);
      context = canvas.getContext("2d");
      const frame = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
      const image = await imageFromDataUrl(frame);
      const clippedTop = Math.max(0, previousScroll + start.viewportHeight - current);
      const destinationY = Math.round((current + clippedTop) * scale);
      context.drawImage(image, 0, Math.round(clippedTop * scale), image.width, Math.max(1, image.height - Math.round(clippedTop * scale)), 0, destinationY, image.width, Math.max(1, image.height - Math.round(clippedTop * scale)));
      previousScroll = current;
      frameIndex += 1;
      progress.style.width = `${Math.min(95, Math.round((previousScroll / Math.max(1, pageHeight - start.viewportHeight)) * 95))}%`;
      status.textContent = `Capturando parte ${frameIndex}…`;
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Não foi possível montar a imagem final.");
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({ url, filename: safeFilename(start.title), saveAs: true });
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    finished = true;
    progress.style.width = "100%";
    status.textContent = "Captura concluída. Escolha onde salvar o PNG.";
  } finally {
    await runInTab(tab.id, (position) => {
      document.documentElement.style.scrollBehavior = position.oldBehavior;
      window.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
    }, [start]).catch(() => {});
    if (!finished) progress.style.width = "0";
  }
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Preparando a captura…";
  progress.style.width = "4%";
  try {
    await capturePage();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Não foi possível capturar esta página.";
    progress.style.width = "0";
  } finally {
    button.disabled = false;
  }
});
