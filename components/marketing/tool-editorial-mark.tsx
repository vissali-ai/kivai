import type { ToolCategory } from "@/lib/tools";

type Props = {
  category?: ToolCategory | string;
  slug?: string;
  className?: string;
};

const ink = "#34323D";
const violet = "#6553AA";
const rust = "#B96F55";
const teal = "#528783";

function ImageMark() {
  return <>
    <path d="M7 10.5 25.5 7 31 27 10.5 31Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="m12 24 5-5 3 2 3-4 5 6" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="13.5" r="2" fill={rust} />
    <path d="M8.5 33h20" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
  </>;
}

function PdfMark() {
  return <>
    <path d="M10 5.5h12l7 7V32H10Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M22 5.5v7h7" fill="none" stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M14.5 18h10M14.5 22h8" stroke={violet} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14.5 27h6" stroke={rust} strokeWidth="2" strokeLinecap="round" />
  </>;
}

function CalculatorMark() {
  return <>
    <rect x="8.5" y="6" width="23" height="28" rx="2.5" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" />
    <path d="M13 11h14v5H13Z" fill="#E5DFEF" stroke={violet} strokeWidth="1.2" />
    <path d="M14 21h2m5 0h2m5 0h1M14 26h2m5 0h2m5 0h1M14 31h2m5 0h2m5 0h1" stroke={rust} strokeWidth="2.4" strokeLinecap="round" />
  </>;
}

function TextMark() {
  return <>
    <path d="M9 6h18l3 3v24H9Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 14h13M14 19h13M14 24h9" stroke={violet} strokeWidth="1.7" strokeLinecap="round" />
    <path d="m22 29 6-7 3 2-6 7-4 1Z" fill="#E8CFC3" stroke={rust} strokeWidth="1.3" strokeLinejoin="round" />
  </>;
}

function SocialMark() {
  return <>
    <path d="M8 9h18v14H15l-5 4v-4H8Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M15 14h7M12 18h10" stroke={violet} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M19 23h13v9H19Z" fill="#E7EEEA" stroke={teal} strokeWidth="1.4" />
    <path d="m21 30 3-3 2 2 2-2 2 3" fill="none" stroke={rust} strokeWidth="1.4" strokeLinejoin="round" />
  </>;
}

function VideoMark() {
  return <>
    <path d="M7.5 11h20v19h-20Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" />
    <path d="M11 11v19m13-19v19" stroke={rust} strokeWidth="1.3" strokeDasharray="2 2" />
    <path d="m16 17 6 3.5-6 3.5Z" fill={violet} />
    <path d="M29 15h3m-3 5h3m-3 5h3" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
  </>;
}

function AudioMark() {
  return <>
    <path d="M6.5 21c2.5 0 2.5-6 5-6s2.5 11 5 11 2.5-16 5-16 2.5 20 5 20 2.5-9 5-9" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 31h20" stroke={rust} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="11.5" cy="15" r="1.4" fill={violet} />
    <circle cx="26.5" cy="30" r="1.4" fill={teal} />
  </>;
}

function BusinessMark() {
  return <>
    <path d="M7 32h26M10 30V15l10-7 10 7v15" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 17h3v4h-3Zm9 0h3v4h-3Zm-9 8h3v5h-3Zm9 0h3v5h-3Z" fill={teal} />
    <path d="M18 30v-6h4v6" fill={rust} />
  </>;
}

function TrafficMark() {
  return <>
    <path d="M7 31h26M10 28V19h5v9m4 0V14h5v14m4 0V9h4v19" fill="#E8E3F0" stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="m10 15 7-4 5 2 8-7" fill="none" stroke={rust} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 6h3v3" fill="none" stroke={rust} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </>;
}

function FilesMark() {
  return <>
    <path d="M7.5 13h10l2.5 3h12v15h-24Z" fill="#E6EBE5" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7.5 17h24l-3 14h-24Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="m14 23 3 3 6-6" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </>;
}

function SmartTvMark() {
  return <>
    <rect x="6.5" y="8" width="27" height="20" rx="2" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" />
    <path d="m15 33 5-5 5 5m-7-9 3-3 3 3" fill="none" stroke={violet} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="16.5" r="2" fill={rust} />
  </>;
}

function GenericMark() {
  return <>
    <path d="M8 11h24v19H8Z" fill="#F2EDE2" stroke={ink} strokeWidth="1.5" />
    <path d="M12 17h16m-16 5h11m-11 4h14" stroke={violet} strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="29" cy="11" r="3" fill={rust} />
  </>;
}

function Art({ category, slug }: Props) {
  if (slug?.includes("pdf") || slug?.includes("curriculo") || slug?.includes("documento")) return <PdfMark />;
  if (slug?.includes("calculadora")) return <CalculatorMark />;
  if (slug?.includes("contador") || slug?.includes("texto") || slug?.includes("palavra")) return <TextMark />;
  if (slug?.includes("social") || slug?.includes("post") || slug?.includes("instagram")) return <SocialMark />;
  if (slug?.includes("video") || slug?.includes("mp4") || slug?.includes("hevc") || slug?.includes("mov")) return <VideoMark />;
  if (slug?.includes("audio") || slug?.includes("mp3")) return <AudioMark />;
  if (slug?.includes("empresa") || slug?.includes("cnpj") || slug?.includes("ncm")) return <BusinessMark />;
  if (slug?.includes("trafego") || slug?.includes("roas") || slug?.includes("roi")) return <TrafficMark />;
  if (slug?.includes("arquivo") || slug?.includes("zip") || slug?.includes("rar")) return <FilesMark />;
  if (slug?.includes("tv")) return <SmartTvMark />;

  switch (category) {
    case "pdf": case "documentos": return <PdfMark />;
    case "imagens": return <ImageMark />;
    case "calculadoras": return <CalculatorMark />;
    case "texto": return <TextMark />;
    case "social": case "marketing": case "ecommerce": case "seo": case "ia": return <SocialMark />;
    case "video": return <VideoMark />;
    case "audio": return <AudioMark />;
    case "empresas": return <BusinessMark />;
    case "trafego": return <TrafficMark />;
    case "arquivos": return <FilesMark />;
    case "smart-tv": return <SmartTvMark />;
    default: return <GenericMark />;
  }
}

export function ToolEditorialMark({ category, slug, className = "size-8" }: Props) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true" focusable="false">
      <Art category={category} slug={slug} />
    </svg>
  );
}
