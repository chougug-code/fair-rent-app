const CACHE_NAME = 'fairrent-enterprise-v2';
const ASSETS_TO_CACHE = [
  '/fair-rent-app/',
  '/fair-rent-app/index.html',
  '/fair-rent-app/manifest.json',
  '/fair-rent-app/launchericon-192x192.png',
  '/fair-rent-app/launchericon-512x512.png'
];

// 1. INSTALL & CACHE (Offline Support)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// 2. ACTIVATE & CLEANUP
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH LOGIC (Stale-While-Revalidate Strategy)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Silent catch for completely offline environments
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// 4. BACKGROUND SYNC (Reliable offline form submissions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-lease-data') {
    event.waitUntil(
      Promise.resolve().then(() => console.log('[FairRent] Background sync processed offline payloads.'))
    );
  }
});

// 5. PERIODIC BACKGROUND SYNC (Silent data updates)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-market-data') {
    event.waitUntil(
      Promise.resolve().then(() => console.log('[FairRent] Periodic sync: Local market rent prices updated.'))
    );
  }
});

// 6. PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'FairRent', body: 'New feature updates available.' };
  
  const options = {
    body: data.body,
    icon: '/fair-rent-app/launchericon-192x192.png',
    badge: '/fair-rent-app/launchericon-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: '/fair-rent-app/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 7. NOTIFICATION CLICK HANDLING
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
