/**
 * Rotas autorizadas a inicializar o Google AdSense nesta etapa.
 *
 * A lista começa de forma conservadora. Novas áreas só devem ser liberadas
 * depois de passarem pela revisão de conteúdo, navegação e experiência.
 */
export function isAdsenseEligiblePathname(pathname: string) {
  return pathname === "/";
}
