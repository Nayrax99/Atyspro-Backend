/* eslint-disable no-undef */
/**
 * Service Worker AtysPro — gestion des notifications push Web
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "AtysPro", body: "Nouvelle activité", url: "/dashboard" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:  payload.body,
      icon:  "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data:  { url: payload.url ?? "/dashboard" },
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
