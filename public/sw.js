// InfraMate Service Worker for Web Push & Attendance Reminders
const CACHE_NAME = "inframate-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push Notifications
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "InfraMate Attendance Reminder", body: event.data.text() };
    }
  }

  const title = data.title || "InfraMate Attendance Reminder";
  const options = {
    body: data.body || data.message || "Your attendance check-in is pending.",
    icon: data.icon || "/assets/icon-192.png",
    badge: data.badge || "/assets/badge.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || `infrasync-reminder-${data.workerId || Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/?tab=labor&subtab=attendance",
      workerId: data.workerId,
      reminderType: data.reminderType,
      timestamp: Date.now(),
    },
    actions: data.actions || [
      {
        action: "check_in",
        title: "✓ Check In",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification tap / action button click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || "/?tab=labor&subtab=attendance";

  if (event.action === "check_in") {
    targetUrl = "/?tab=labor&subtab=attendance&autoCheckIn=true";
  } else if (event.action === "check_out") {
    targetUrl = "/?tab=labor&subtab=attendance&autoCheckOut=true";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          client.postMessage({
            type: "INFRASYNC_NOTIFICATION_CLICK",
            action: event.action,
            data: notifData,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
