import {
  AudioLines, BriefcaseBusiness, Calculator, FileText, Files, Image,
  LayoutGrid, MessageSquareText, MonitorPlay, PenLine, TrendingUp, Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolCategory } from "@/lib/tools";

type Props = { category?: ToolCategory | string; slug?: string; className?: string };

function getIcon(category?: string, slug?: string): LucideIcon {
  const key = `${slug ?? ""} ${category ?? ""}`.toLowerCase();
  if (/pdf|document|curriculo/.test(key)) return FileText;
  if (/calculadora|calculator/.test(key)) return Calculator;
  if (/texto|palavra|text/.test(key)) return PenLine;
  if (/social|post|instagram|marketing|ecommerce|seo|ia/.test(key)) return MessageSquareText;
  if (/video|mp4|hevc|mov|tv/.test(key)) return Video;
  if (/audio|mp3/.test(key)) return AudioLines;
  if (/empresa|cnpj|ncm/.test(key)) return BriefcaseBusiness;
  if (/trafego|roas|roi/.test(key)) return TrendingUp;
  if (/arquivo|zip|rar/.test(key)) return Files;
  if (/imagem|image/.test(key)) return Image;
  if (/smart-tv/.test(key)) return MonitorPlay;
  return LayoutGrid;
}

export function ToolEditorialMark({ category, slug, className = "size-8" }: Props) {
  const Icon = getIcon(category, slug);
  return <span className={`inline-flex items-center justify-center rounded-lg border border-border bg-[#F3EEFC] text-primary ${className}`} aria-hidden="true"><Icon size={18} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /></span>;
}
