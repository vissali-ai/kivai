// Missões iniciais baseadas nas ferramentas públicas existentes. Sem novos processadores.
export type FirstMissionGoal = "images" | "documents" | "sales" | "social";

export type FirstMission = {
  slug: string;
  title: string;
  instruction: string;
  success: string;
};

const firstMissions: Record<FirstMissionGoal, FirstMission> = {
  images: {
    slug: "compressor-de-imagens",
    title: "Comprima sua primeira imagem",
    instruction: "Escolha uma imagem, clique em Comprimir imagem e confira o arquivo pronto.",
    success: "Imagem processada",
  },
  documents: {
    slug: "unir-pdfs",
    title: "Una dois PDFs",
    instruction: "Adicione dois documentos PDF e gere um arquivo único para baixar.",
    success: "PDF unido gerado",
  },
  sales: {
    slug: "calculadora-de-markup",
    title: "Calcule um preço de venda",
    instruction: "Preencha o custo e o markup desejado para descobrir o preço sugerido.",
    success: "Preço calculado",
  },
  social: {
    slug: "planejador-de-conteudo-social-media",
    title: "Crie seu primeiro planejamento",
    instruction: "Informe tema, objetivo, público e rede social. Depois, clique em Gerar planejamento.",
    success: "Planejamento gerado",
  },
};

export function getFirstMission(goal: string | null | undefined): FirstMission {
  if (goal === "images" || goal === "documents" || goal === "sales" || goal === "social") {
    return firstMissions[goal];
  }
  return firstMissions.images;
}
