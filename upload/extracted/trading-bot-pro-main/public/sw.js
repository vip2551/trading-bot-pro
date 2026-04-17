/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Claim clients immediately
clientsClaim();

// Precache all generated assets
precacheAndRoute(self.__WB_MANIFEST);

// App shell routing
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(({ request, url }) => {
  if (request.mode !== 'navigate') return false;
  if (url.pathname.startsWith('/_next')) return false;
  if (url.pathname.match(fileExtensionRegexp)) return false;
  return true;
}, createHandlerBoundToURL('/'));

// Cache static assets
registerRoute(
  ({ url }) => url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/'),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Cache API calls with stale-while-revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 5 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Background sync for offline trade actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-trades') {
    event.waitUntil(syncTrades());
  }
});

async function syncTrades() {
  try {
    const cache = await caches.open('offline-trades');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
interface PushData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    tradeId?: string;
  };
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data: PushData = event.data.json();
  
  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge.png',
    tag: data.tag || 'trading-notification',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      { action: 'view', title: 'View | عرض' },
      { action: 'dismiss', title: 'Dismiss | إغلاق' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Periodic background sync for price alerts
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'check-price-alerts') {
    event.waitUntil(checkPriceAlerts());
  }
});

async function checkPriceAlerts() {
  try {
    // Fetch current prices and check alerts
    const response = await fetch('/api/alerts/check', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check price alerts');
    }
  } catch (error) {
    console.error('Price alert check failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_TRADE') {
    event.waitUntil(
      caches.open('offline-trades').then((cache) => {
        return cache.put(
          new Request('/api/trades/offline'),
          new Response(JSON.stringify(event.data.trade))
        );
      })
    );
  }
});

console.log('Service Worker loaded - Trading Bot Pro');
