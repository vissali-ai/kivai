import type { FC, ReactNode } from "react";

export interface AdSlotProps {
  variant?: "banner";
  children?: ReactNode;
  className?: string;
}

export const AdSlot: FC<AdSlotProps> = () => {
  // Reserva de API para placements futuros. Até a aprovação do site, não
  // produz contêiner vazio, rótulo publicitário ou unidade de anúncio.
  return null;
};

export default AdSlot;
