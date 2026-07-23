import type { AdPlacement, AdPlacementConfig } from "./types";

/**
 * Registro central de todos os placements do Kivai.
 *
 * Nenhuma página deve conhecer IDs do Google AdSense.
 * As páginas utilizam apenas o nome do placement.
 */

export const adRegistry: Record<AdPlacement, AdPlacementConfig> = {
  "home-hero": {
    placement: "home-hero",
    provider: "adsense",
    responsive: true,
    lazy: false,
    enabled: true,
  },

  "home-inline": {
    placement: "home-inline",
    provider: "adsense",
    responsive: true,
    lazy: true,
    enabled: true,
  },

  "tool-top": {
    placement: "tool-top",
    provider: "adsense",
    responsive: true,
    lazy: false,
    enabled: true,
  },

  "tool-inline": {
    placement: "tool-inline",
    provider: "adsense",
    responsive: true,
    lazy: true,
    enabled: true,
  },

  "tool-bottom": {
    placement: "tool-bottom",
    provider: "adsense",
    responsive: true,
    lazy: true,
    enabled: true,
  },

  "tool-sidebar": {
    placement: "tool-sidebar",
    provider: "adsense",
    responsive: true,
    lazy: true,
    enabled: true,
  },

  "page-header": {
    placement: "page-header",
    provider: "adsense",
    responsive: true,
    lazy: false,
    enabled: true,
  },

  "page-footer": {
    placement: "page-footer",
    provider: "adsense",
    responsive: true,
    lazy: true,
    enabled: true,
  },
};