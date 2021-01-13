/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type {};

const cacheName = "::default";
const version = "0.0.1";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(version + cacheName).then(function (cache) {
      return cache.addAll(["/offline/"]);
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
  if (request.headers.get("Accept")?.indexOf("text/html") !== -1) {
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
  event.respondWith(
    caches.match(request).then(function (response) {
      return (
        response ||
        fetch(request).catch(function () {
          // If the request is for an image, show an offline placeholder
          // if (request.headers.get('Accept').indexOf('image') !== -1) {
          //   return new Response('<svg width="400" height="400" role="img" aria-labelledby="offline-title" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g><line stroke="#666666" x1="0" y1="0" x2="400" y2="400"/><line stroke="#666666" x1="0" y1="400" x2="400" y2="0"/></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' }});
          // }
        })
      );
    }) as Promise<Response>
  );
});
