export const VIDEO_COMPRESS_MAX_SIZE = 200 * 1024 * 1024;
export const VIDEO_COMPRESS_MAX_SIZE_LABEL = "200 MB";
export const VIDEO_COMPRESS_ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,video/mpeg,.mp4,.mov,.webm,.avi,.mkv,.mpeg,.mpg";
export const VIDEO_COMPRESS_EXTENSIONS = ["mp4", "mov", "webm", "avi", "mkv", "mpeg", "mpg"];

export type CompressionMode = "light" | "balanced" | "maximum";
export type CompressionPreset = "custom" | "whatsapp" | "email" | "social" | "site" | "quality";
export type AudioMode = "keep" | "reduce" | "remove";

export const MODE_OPTIONS = {
  light: { label: "Compressão leve", description: "Melhor qualidade, redução menor.", factor: 1, crf: 20 },
  balanced: { label: "Compressão equilibrada", description: "Boa qualidade e arquivo menor.", factor: 0.72, crf: 25 },
  maximum: { label: "Compressão máxima", description: "Arquivo menor, com maior perda de qualidade.", factor: 0.48, crf: 30 },
} as const;

export const PRESET_OPTIONS = {
  custom: { label: "Personalizado", mode: "balanced", resolution: "auto", audio: "keep", audioBitrate: 128 },
  whatsapp: { label: "WhatsApp", mode: "maximum", resolution: "720", audio: "reduce", audioBitrate: 96 },
  email: { label: "E-mail", mode: "maximum", resolution: "480", audio: "reduce", audioBitrate: 64 },
  social: { label: "Redes sociais", mode: "balanced", resolution: "1080", audio: "keep", audioBitrate: 128 },
  site: { label: "Site", mode: "maximum", resolution: "720", audio: "reduce", audioBitrate: 96 },
  quality: { label: "Manter qualidade", mode: "light", resolution: "original", audio: "keep", audioBitrate: 128 },
} as const;

export const HEIGHT_BITRATES: Record<number, number> = { 2160: 10000, 1080: 4500, 720: 2500, 480: 1100, 360: 650 };
