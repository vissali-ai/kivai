export const reminderToolChoices = [
  { slug: "compressor-de-imagens", label: "Comprimir imagens" },
  { slug: "removedor-de-fundo", label: "Remover fundo de imagens" },
  { slug: "unir-pdfs", label: "Unir PDFs" },
  { slug: "compactar-pdf", label: "Compactar PDFs" },
  { slug: "calculadora-de-markup", label: "Calcular preços" },
  { slug: "planejador-de-conteudo-social-media", label: "Planejar conteúdos" },
  { slug: "gerador-de-qr-code", label: "Gerar QR Codes" },
] as const;

export const reminderWeekdays = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
] as const;

export type ReminderPreference = {
  enabled: boolean;
  weekday: number;
  hour: number;
  time_zone: string;
  tool_slug: string;
  delivery_channel: "browser" | "email";
};

export const defaultReminder: ReminderPreference = {
  enabled: false,
  weekday: 1,
  hour: 9,
  time_zone: "America/Sao_Paulo",
  tool_slug: "compressor-de-imagens",
  delivery_channel: "browser",
};

export function validReminderTimezone(value: string) {
  if (value.length > 64 || !/^[A-Za-z_]+(?:\/[A-Za-z_+-]+){1,3}$/.test(value)) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; } catch { return false; }
}

export function dueReminderAt(preference: ReminderPreference, now: Date): string | null {
  if (!preference.enabled || !validReminderTimezone(preference.time_zone)) return null;
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: preference.time_zone,
    weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  });
  const parts = Object.fromEntries(format.formatToParts(now).map(part => [part.type, part.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  if (day !== preference.weekday || Number(parts.hour) !== preference.hour) return null;
  return `${parts.year}-${parts.month}-${parts.day}`;
}
