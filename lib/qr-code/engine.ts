import QRCode from "qrcode";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type QrCodeOptions = {
  size: number;
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: QrErrorCorrectionLevel;
};

export const DEFAULT_QR_CODE_OPTIONS: QrCodeOptions = {
  size: 320,
  margin: 2,
  foregroundColor: "#0f172a",
  backgroundColor: "#ffffff",
  errorCorrectionLevel: "M",
};

function normalizeOptions(
  options?: Partial<QrCodeOptions>,
): QrCodeOptions {
  return {
    ...DEFAULT_QR_CODE_OPTIONS,
    ...options,
  };
}

function validateContent(content: string) {
  if (!content.trim()) {
    throw new Error("Informe um conteúdo para gerar o QR Code.");
  }
}

function buildQrOptions(options: QrCodeOptions) {
  return {
    width: options.size,
    margin: options.margin,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor,
    },
    errorCorrectionLevel: options.errorCorrectionLevel,
  };
}

export async function generateQrCodePng(
  content: string,
  options?: Partial<QrCodeOptions>,
): Promise<string> {
  validateContent(content);

  const normalizedOptions = normalizeOptions(options);

  return QRCode.toDataURL(
    content.trim(),
    buildQrOptions(normalizedOptions),
  );
}

export async function generateQrCodeSvg(
  content: string,
  options?: Partial<QrCodeOptions>,
): Promise<string> {
  validateContent(content);

  const normalizedOptions = normalizeOptions(options);

  return QRCode.toString(
    content.trim(),
    {
      ...buildQrOptions(normalizedOptions),
      type: "svg",
    },
  );
}

export function downloadDataUrl(
  dataUrl: string,
  fileName: string,
) {
  const link = document.createElement("a");

  link.href = dataUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadSvg(
  svgContent: string,
  fileName: string,
) {
  const blob = new Blob(
    [svgContent],
    {
      type: "image/svg+xml;charset=utf-8",
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}