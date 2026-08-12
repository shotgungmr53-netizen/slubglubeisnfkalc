const CACHE = "money-tracker-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

// Install new service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Delete old caches and take control immediately
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for HTML, cache-first for other files
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;

  // Always check GitHub Pages for the latest HTML
  if (request.mode === "navigate" ||
      request.destination === "document") {

    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => caches.match(request))
        .then(response => response || caches.match("./index.html"))
    );

    return;
  }

  // Cache other assets for speed/offline use
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        });
      })
      .catch(() => caches.match("./index.html"))
  );
});
