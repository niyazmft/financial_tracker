const CACHE_NAME = 'fintrack-v2';
const STATIC_ASSETS = [
  '/',
  '/dashboard', // For initial load of the Vue app
  '/styles/main.css',
  // Add other critical local assets here, e.g., '/assets/main.js' if it's static
  // Vite generates hashed names, so pre-caching specific JS files can be tricky.
  // We'll rely on the Stale-While-Revalidate for them.
];

// Install Event: Cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // console.log('[Service Worker] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of clients immediately
  );
});

// Fetch Event: Robust Network-First and Stale-While-Revalidate strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignore non-http requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // 2. Ignore external domains (e.g., ui-avatars.com, firebase, NocoDB API)
  if (url.origin !== self.location.origin) {
    // For API calls to our backend, they are also same-origin.
    // For external APIs, let the browser handle them directly.
    return; 
  }

  // 3. IMPORTANT: Skip caching for POST, PUT, DELETE requests
  // These methods typically send data and are not suitable for caching.
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request)); // Go straight to network
    return;
  }

  // Handle all GET requests with a Stale-While-Revalidate strategy
  // This tries to return a cached response immediately, then updates the cache from the network.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response from the network
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // Network fetch failed. Log the error and fall back to cache if available.
          console.error('[Service Worker] Fetch failed:', event.request.url, error);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache and network failed, provide a generic offline response or re-throw
          return new Response('Offline: Could not retrieve resource.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({'Content-Type': 'text/plain'})
          });
        });

      // If there's a cached response, return it immediately.
      // Otherwise, wait for the network fetch.
      return cachedResponse || networkFetch;
    })
  );
});