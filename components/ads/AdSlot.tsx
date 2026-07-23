import type { ReactNode } from "react";

export interface AdSlotProps {
  variant?: "banner";
  children?: ReactNode;
  className?: string;
}

export function AdSlot({
  variant = "banner",
}: AdSlotProps) {
  // Implementação provisória.
  // Na próxima etapa este componente passará a utilizar
  // o engine.ts e o AdsenseProvider.

  return null;
}

export default AdSlot;