import { adsConfig } from "./config";
import { adRegistry } from "./registry";
import type { AdPlacement, AdPlacementConfig } from "./types";

/**
 * Retorna a configuração completa de um placement.
 *
 * Este é o ponto central de decisão do sistema de anúncios.
 * No futuro poderemos aplicar regras como:
 *
 * - Consentimento LGPD
 * - Usuário Premium
 * - Campanhas internas
 * - Google Ad Manager
 * - A/B Tests
 * - Fallback entre provedores
 */
export function resolveAdPlacement(
  placement: AdPlacement
): AdPlacementConfig | null {
  // Sistema desabilitado
  if (!adsConfig.enabled) {
    return null;
  }

  // Placement inexistente
  const config = adRegistry[placement];

  if (!config) {
    return null;
  }

  // Placement desabilitado
  if (!config.enabled) {
    return null;
  }

  /**
   * O provider efetivo sempre é definido
   * pela configuração global.
   */
  return {
    ...config,
    provider: adsConfig.provider,
  };
}