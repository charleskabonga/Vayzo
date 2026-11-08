// Service Worker for Vayzo Push Notifications
const CACHE_NAME = 'vayzo-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for Web Push events
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Vayzo Alert',
    body: 'You have a new update on your delivery.',
    icon: '/assets/icon.png',
    badge: '/assets/badge.png',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = { ...notificationData, ...parsed };
    } catch {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/assets/icon.png',
    badge: notificationData.badge || '/assets/badge.png',
    tag: notificationData.tag || 'vayzo-general',
    data: notificationData.data || { url: '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Vayzo' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
