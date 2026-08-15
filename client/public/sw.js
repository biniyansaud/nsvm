const CACHE_NAME = "radiant-v9";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/manus-storage/pwa-icon-192.png",
  "/manus-storage/pwa-icon-512.png",
  "/manus-storage/pwa-preview.svg"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => Promise.resolve());
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First, fallback to cache)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and local URLs
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass dev server assets, HMR, and API endpoints
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If completely offline and not cached, return index.html for client-side routing fallback
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          // Fallback to direct network fetch or empty response for assets to avoid broken 503 text
          return fetch(event.request).catch(() => new Response("", { status: 404, statusText: "Not Found" }));
        });
      })
  );
});
