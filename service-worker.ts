/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type {};

const cacheName = "::swdevextent";
const version = "v1.1.0";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(version + cacheName).then(function (cache) {
      return cache.addAll(["/", "/offline/"]);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // Remove caches whose name is no longer valid
      return Promise.all(
        keys
          .filter(function (key) {
            return key.indexOf(version) !== 0;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  // Always fetch non-GET requests from the network
  if (request.method !== "GET") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("/offline/");
      }) as Promise<Response>
    );
    return;
  }

  // For HTML requests, try the network first, fall back to the cache,
  // finally the offline page
  if (
    request.headers.get("Accept")?.indexOf("text/html") !== -1 &&
    request.url.startsWith(this.origin)
  ) {
    // The request is text/html, so respond by caching the
    // item or showing the /offline offline
    event.respondWith(
      fetch(request)
        .then(function (response) {
          // Stash a copy of this page in the cache
          const copy = response.clone();
          caches.open(version + cacheName).then(function (cache) {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (response) {
            // return the cache response or the /offline page.
            return response || caches.match("/offline/");
          });
        }) as Promise<Response>
    );
    return;
  }

  // For non-HTML requests, look in the cache first, fall back to the network
  // If it's an image, render an X in an SVG.
  if (
    request.headers.get("Accept")?.indexOf("text/plain") === -1 &&
    request.url.startsWith(this.origin)
  ) {
    event.respondWith(
      caches.match(request).then(function (response) {
        return (
          response ||
          fetch(request)
            .then(function (response) {
              const copy = response.clone();

              if (
                copy.headers.get("Content-Type")?.indexOf("text/plain") === -1
              ) {
                caches.open(version + cacheName).then(function (cache) {
                  cache.put(request, copy);
                });
              }

              return response;
            })
            .catch(function () {})
        );
      }) as Promise<Response>
    );
    return;
  }
});
