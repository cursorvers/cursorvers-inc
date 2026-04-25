// Service Worker for Cursorvers PWA
const CACHE_VERSION = '1.0.6'; // Updated: 2026-04-25 - mobile video unified with desktop content; URL key bump to ?v=20260425c
const CACHE_NAME = `cursorvers-v${CACHE_VERSION}`;

// Static assets - Cache First
const STATIC_CACHE = [
  '/dist/tailwind.min.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/Cursorvers_logo_navy.webp',
  '/Cursorvers_logo_white.webp'
];

// HTML pages - Network First
const HTML_CACHE = [
  '/',
  '/index.html',
  '/services.html',
  '/contact.html',
  '/message.html'
];

// Install event - cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE);
      })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
    );
    await self.clients.claim();
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      try {
        await client.navigate(client.url);
      } catch (_e) {
        // Ignore clients that cannot be navigated
      }
    }
  })());
});

// Fetch event - Network First for HTML, Cache First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network First for HTML pages
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(new Request(event.request.url, { cache: 'reload', credentials: event.request.credentials, headers: event.request.headers }))
        .then((response) => {
          // Clone and cache the fresh response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First for static assets
  // Bypass Service Worker cache for media files.
  if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm') || url.pathname.endsWith('.mov') || url.pathname.endsWith('.m4v') || url.pathname.endsWith('.ogg')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});
