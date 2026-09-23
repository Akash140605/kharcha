const CACHE = "kharcha-v5";

const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => {})
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Sirf GET requests cache karo
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {

      const network = fetch(event.request)
        .then((response) => {

          // Successful response ko cache me save karo
          if (
            response &&
            response.status === 200 &&
            response.type !== "opaque"
          ) {
            const clone = response.clone();

            caches.open(CACHE)
              .then((cache) => cache.put(event.request, clone))
              .catch(() => {});
          }

          return response;
        })
        .catch(() => {
          // Internet nahi hai to cached version return karo
          return (
            cached ||
            new Response("Offline", {
              status: 503,
              headers: {
                "Content-Type": "text/plain"
              }
            })
          );
        });

      // Pehle cache, nahi mila to network
      return cached || network;
    })
  );
});