import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
// Cache the application shell only. Authenticated API responses stay network-only.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api(?:\/|$)/],
  }),
);

self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data?.json();
  } catch {
    data = null;
  }
  event.waitUntil(
    self.registration.showNotification(data?.title || 'E don happen', {
      body:
        data?.body ||
        'There is a new local update. Open your inbox to view it.',
      icon: '/pwa-192x192.png',
      badge: '/favicon-32x32.png',
      tag: data?.tag || 'local-update',
      data: { url: data?.url || '/dashboard' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || '/dashboard',
    self.location.origin,
  );
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.navigate(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    })(),
  );
});
