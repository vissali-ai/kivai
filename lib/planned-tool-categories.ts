import { Archive, Building2 } from "lucide-react";

export const plannedToolCategories = [
  {
    slug: "arquivos",
    name: "Arquivos",
    description:
      "Compacte e descompacte arquivos ZIP e RAR com ferramentas online simples e práticas.",
    href: "/ferramentas/arquivos",
    icon: Archive,
  },
  {
    slug: "empresas",
    name: "Empresas",
    description:
      "Consulte CNPJ, CNAE, NCM, bancos e domínios .BR para apoiar pesquisas empresariais e comerciais.",
    href: "/ferramentas/empresas",
    icon: Building2,
  },
] as const;
