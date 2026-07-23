/**
 * ==========================================================
 * KIVAI Ads System
 * Tipos compartilhados do módulo de anúncios
 * ==========================================================
 */

/**
 * Provedores suportados.
 * Hoje utilizamos apenas AdSense,
 * mas a arquitetura já fica preparada
 * para novos provedores.
 */
export type AdProviderType =
  | "adsense"
  | "admanager"
  | "internal"
  | "affiliate";

/**
 * Todos os locais onde um anúncio pode aparecer.
 *
 * Nunca utilizamos tamanhos (728x90, 300x250...)
 * e sim posições lógicas da aplicação.
 */
export type AdPlacement =
  | "home-hero"
  | "home-inline"
  | "tool-top"
  | "tool-inline"
  | "tool-bottom"
  | "tool-sidebar"
  | "page-header"
  | "page-footer";

/**
 * Configuração de um placement.
 */
export interface AdPlacementConfig {
  placement: AdPlacement;

  provider: AdProviderType;

  responsive: boolean;

  lazy: boolean;

  enabled: boolean;
}

/**
 * Configuração global do sistema.
 */
export interface AdsConfig {
  provider: AdProviderType;

  enabled: boolean;

  autoAds: boolean;

  testMode: boolean;
}