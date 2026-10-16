/* Kivai PWA: notificações opcionais, sem armazenamento offline de arquivos ou APIs. */
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { /* mensagem inválida */ }
  const title = typeof payload.title === "string" && payload.title.length < 100
    ? payload.title : "Lembrete do Kivai";
  const body = typeof payload.body === "string" && payload.body.length < 300
    ? payload.body : "Sua rotina está esperando no Kivai.";
  const url = typeof payload.url === "string" && /^\/ferramentas\/[a-z0-9-]+$/.test(payload.url)
    ? payload.url : "/conta";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/pwa-icon/192",
    badge: "/pwa-icon/192",
    tag: "kivai-routine-reminder",
    data: { url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url;
  const url = typeof path === "string" && (/^\/ferramentas\/[a-z0-9-]+$/.test(path) || path === "/conta")
    ? path : "/conta";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(url);
      return existing.focus();
    }
    return self.clients.openWindow(url);
  })());
});

// Sem listener de fetch: ferramentas, uploads, downloads e API permanecem sempre online.
