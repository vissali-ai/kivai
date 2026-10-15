/* Kivai PWA: instalação sem cache de arquivos, documentos, respostas privadas ou APIs.
 * As notificações opcionais serão tratadas somente na etapa 5.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Sem listener de fetch: todas as requisições continuam pela rede normalmente.
