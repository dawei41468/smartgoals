self.addEventListener("push", function (event) {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // ignore
  }

  const title = data.title || "SmartGoals";
  const body = data.body || "You have a new notification.";
  const icon = "/icon-192.png";
  const tag = data.tag || "smartgoals-push";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag,
      data: data.data || {},
      renotify: false,
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
