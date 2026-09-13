/* ═══════════════════════════════════════════════════════════════════════
   SERVICE WORKER TURTI

   Лежит в корне — значит область действия весь сайт.
   Задача одна: показать напоминание о секретном комплименте и открыть
   магазин по нажатию. Ничего не кэшируем, чтобы сайт всегда был свежий.
   ═══════════════════════════════════════════════════════════════════════ */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = {}; }

  const title = d.title || "TURTI — ваш секрет ждёт вас 🎁";
  const options = {
    body: d.body || "Повторите заказ, и мы вложим комплимент внутрь следующей коробки.",
    icon: d.icon || "/images/push-icon.png",
    badge: d.badge || "/images/push-badge.png",
    tag: "turti-surprise",
    renotify: false,
    requireInteraction: false,
    data: { url: d.url || "/?from=push" },
    actions: [{ action: "open", title: "Открыть магазин" }]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/?from=push";

  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.includes(self.location.origin)) {
        await w.focus();
        if ("navigate" in w) { try { await w.navigate(url); } catch {} }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

/* Браузер сам обновил подписку — сообщаем серверу новую */
self.addEventListener("pushsubscriptionchange", event => {
  event.waitUntil((async () => {
    try {
      const old = event.oldSubscription;
      if (old) {
        await fetch("/api/push-unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: old.endpoint })
        });
      }
    } catch {}
  })());
});
