import {
  AudioLines,
  Drum,
  Guitar,
  Headphones,
  Mic2,
  Music2,
  Piano,
  Radio,
  type LucideIcon,
} from "lucide-react";

export function getMusicGenreIcon(name: string): LucideIcon {
  const value = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/rock|metal|punk|grunge|alternativo/.test(value)) return Guitar;
  if (/samba|pagode|bossa|forro|axe|maracatu|frevo/.test(value)) return Drum;
  if (/sertanejo|country|moda de viola/.test(value)) return Guitar;
  if (/eletron|house|techno|trance|dance|funk|disco/.test(value)) return AudioLines;
  if (/rap|hip hop|hip-hop|trap/.test(value)) return Mic2;
  if (/gospel|louvor|religios|coral/.test(value)) return Mic2;
  if (/classica|erudita|instrumental|jazz|blues/.test(value)) return Piano;
  if (/pop|mpb|indie|romant/.test(value)) return Radio;
  if (/audio|podcast|ambiente/.test(value)) return Headphones;
  return Music2;
}
