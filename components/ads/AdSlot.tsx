import type { FC, ReactNode } from "react";

import type { AdPlacement } from "@/lib/ads/types";

export interface AdSlotProps {
  /**
   * Posição lógica do anúncio. O componente não conhece tamanhos, IDs de
   * unidade ou detalhes de provedor.
   */
  placement?: AdPlacement;
  variant?: "banner";
  children?: ReactNode;
  className?: string;
}

export const AdSlot: FC<AdSlotProps> = () => {
  // Reserva de API para placements futuros. Até a aprovação do site, não
  // produz contêiner vazio, rótulo publicitário ou unidade de anúncio.
  // O placement é intencionalmente lógico para que AdSense, Ad Manager,
  // campanhas internas ou afiliados possam ser conectados sem alterar as
  // páginas das ferramentas.
  return null;
};

export default AdSlot;
