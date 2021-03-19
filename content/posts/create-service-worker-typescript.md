---
title: Create a Service Worker with TypeScript
metaDescription: Use TypeScript and the Service Worker Web API to create a service worker with a network first then cache caching strategy, that can show an offline page when no connection is available.
author: James Edwards
tags:
  - TypeScript
  - Babel
  - Web API
guid: 374b02e7-fcff-4f37-a1ba-d78784f95801
---

The [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) is available to use in all major browsers. Service Workers are JavaScript files that contain event driven worker code, that do not run on the main thread of the browser. They are used as a proxy for network requests, more specifically, service workers can be used to intercept requests and modify them as well as cache responses. In addition to caching responses a service worker can be used to enhance the user experience of your website by displaying an offline page when there is no network connection available.

In this example, [TypeScript](https://www.typescriptlang.org/) is used to create a service worker with a network first then cache, caching strategy, to support viewing previously visited pages when offline. When there is no network connection available and a previous page version is not cached, the service worker will display an offline page.

### Configure TypeScript and Babel with ES Modules

Before adding the TypeScript code for the service worker there are some prerequisite steps to configure the TypeScript compiler. If you want to include Typescript into your project you can view these posts:

- [Setup TypeScript Compilation with npm package.json Scripts](/npm-compile-typescript/)
- [Import and Export ES Modules in Node.js using TypeScript with Babel Compilation](/import-es-modules-in-nodejs-with-typescript-and-babel/)

to find more information about using TypeScript. The configuration will include [Babel](https://babeljs.io/) for TypeScript compilation as shown in the second post above with some minor adjustments, to support browser use rather than Node.js, made to the Babel configuration.

#### Configure package.json Scripts

Create a package.json file by running <kbd>npm init</kbd> and then run the command <kbd>npm install typescript cross-env @babel/cli @babel/core @babel/preset-env @babel/preset-env @babel/preset-typescript --save</kbd>. You then need to add three package.json scripts that look like this:

```json
{
  "scripts": {
    "typecheck": "tsc --p .",
    "compile": "cross-env-shell babel $INIT_CWD -d $INIT_CWD --extensions '.ts' --no-comments --source-maps",
    "typecheck-compile": "npm run typecheck && npm run compile"
  }
}
```

#### Configure TypeScript for Type Checking Only

The package.json "typecheck" script will invoke the TypeScript compiler and only is responsible for type checking the TypeScript code, and it will not emit any JavaScript. The TypeScript compiler configuration options are specified in a file named "tsconfig.json". You can create this file with the following settings:

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "strict": true,
    "module": "esnext",
    "lib": ["es2019", "es6", "dom", "webworker"],
    "noEmit": true,
    "moduleResolution": "node",
    "skipLibCheck": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules/**/*"]
}
```

Notice that the "lib" property contains a value for "webworker" among the values. This is important because it indicates to the TypeScript compiler that it should load the [type definitions for the Worker APIs](https://github.com/microsoft/TypeScript/blob/master/lib/lib.webworker.d.ts).

The package.json "compile" script uses Babel to compile TypeScript and will be responsible for outputting JavaScript. The Babel compiler does not type check the TypeScript source code, so if there are any errors present the Babel compiler may attempt to provide output rather than indicating there was an error. Also the Babel compiler CLI command requires a source folder and output folder to be specified so this is set to the project folder with the "$INIT_CWD" npm CLI variable, for both the source and output folders. This way the JavaScript files will be written to the same folder as the TypeScript files.

#### Configure Babel with @babel/preset-typescript and @babel/preset-env

We are going to target browsers that are using ES Modules with the [preset-env preset](https://babeljs.io/docs/en/babel-preset-env), in addition to using the [preset-typescript preset](https://babeljs.io/docs/en/babel-preset-typescript). You can configure this by adding a [babel.config.json](https://babeljs.io/docs/en/configuration#babelconfigjson) file in the same folder as the package.json with the following settings:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": false,
        "targets": { "esmodules": true }
      }
    ],
    ["@babel/preset-typescript"]
  ],
  "ignore": ["node_modules"],
  "comments": false,
  "minified": true
}
```

The presets are applied in the reverse order that they are listed in the Babel.config.json, so the preset-env changes will be applied to the JavaScript output created by preset-typescript.

#### TypeScript Type Checking with Babel Compilation

To combine both the typecheck and compile scripts you can run the package.json typecheck-compile command: <kbd>npm run typecheck-compile</kbd>. This will first use the TypeScript compiler to typecheck the code and then use the Babel compiler to generate JavaScript for the browser. If there are any type checking errors the command will fail and they will be shown in the console.

### Register Service Worker

Now that we have TypeScript and Babel configured to use [ES Modules](https://nodejs.org/api/esm.html), but before creating the actual service worker code, we need to write some code that will register the service worker in the browser. This code can be included in the HTML source directly, or in a script tag. If you are including the code with a script tag make sure to reference the JavaScript output file that is generated as a result of the TypeScript compilation process and not the TypeScript source file. We can name this file "script.ts" and place it in the root of the project.

```typescript
export default class Main {
  constructor() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then(function () {
          console.log("Service Worker Registered");
        });
    }
  }
}

new Main();
```

### HTML include script type="module"

You can include this script in an HTML file by creating a new file named "index.html", and save it in the root of the project, with this content:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Service Worker Example</title>
  </head>
  <body>
    This page is loading a service worker!
    <script type="module" src="/script.js"></script>
  </body>
</html>
```

When the browser loads the HTML page the JavaScript above will attempt to load the service worker. If the browser does not support service workers the code will be skipped.

Besides the index.html file we are also going to need an HTML file for an offline page. In the same folder that the index.html file is saved create a new file name "offline.html" and add this content to show an offline state:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>You are not connected to the internet</title>
  </head>
  <body>
    You are not connected to the internet!
    <script type="module" src="/script.js"></script>
  </body>
</html>
```

When the service worker code is added in the following step the offline page will be automatically cached for future usage.

### Set up Service Worker

Registering the service worker is what invokes the service worker code that is not running on the main thread. Inside of the service worker we will write code to listen for certain types of events that are triggered by the browser. These events are:

- [install](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/install_event)
- [activate](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/activate_event)
- [fetch](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/onfetch)

We can add the install event first by adding the following code to a file named "service-worker.ts". You can use a different name if you want, but make sure that it matches what is included in the "navigator.serviceWorker.register" function used in the previous step. In the service-worker.js file add the following code:

```typescript
/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type {};
declare const self: ServiceWorkerGlobalScope;
```

This is the beginning code for using a service worker with TypeScript and Babel compilation. The first line is a [triple-slash directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html) to indicate to the TypeScript compiler to use the Worker API type definitions. This is why it was important to note the inclusion of the Worker API type definitions in the "lib" setting of the tsconfig.json file.

After loading the Worker API type definitions, the next line is and empty type export that prevents an error as a result of the typescript compiler option "isolatedModules". Using "isolatedModules" is recommend when [using Babel with TypeScript](https://www.typescriptlang.org/docs/handbook/babel-with-typescript.html), but this requires all modules to have either one export or import statement. Since the service worker is a standalone script it cannot import or export modules, and by including the empty type export, the typescript compiler will no longer show the error:

```bash
(error TS1208: All files must be modules when the '--isolatedModules' flag is provided)[]
```

The empty type export will be removed when they TypeScript code is compiled into JavaScript with Babel. This is a workaround until service workers have module support, and only needed when using the "--isolatedModules" flag with TypeScript.

The following declaration allows the type "ServiceWorkerGlobalScope" included in the WebWorker API type definitions, to be specified for the "self" variable that already exists. Without the type declaration the self variable would have the type "Window & typeof globalThis", and the type definitions of that type do not overlap with the "ServiceWorkerGlobalScope" type. This is because the service worker does not have access to the window object or any other global scope, and the self variable used in the service worker code is of type [WorkerGlobalScope.self](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/self), rather than [Window.self](https://developer.mozilla.org/en-US/docs/Web/API/Window/self).

Similar to the empty type export shown above this is also a workaround that is only needed to inform the TypeScript compiler of the proper types that are being used. There is some discussion regarding the type signatures on the TypeScript Github repository:

- [Service Worker Typings](https://github.com/microsoft/TypeScript/issues/11781)
- [Unable to access ServiceWorkerGlobalScop via self](https://github.com/microsoft/TypeScript/issues/14877)

#### Service Worker install Event

The first event listener that is added to the code, listens for the service worker install event to be triggered. When the install event occurs a cache using a combination of the "cacheName" and "version" variables is created, if it does not exist, and the index and offline HTML pages will be automatically added to the cache. Add this code below the "self" variable declaration:

```typescript
const cacheName = "::yourserviceworker";
const version = "v0.0.1";

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(version + cacheName).then(function (cache) {
      return cache.addAll(["/", "/offline"]);
    })
  );
});
```

#### Service Worker activate Event

Below the install event listener code we can add a separate event listener that will be triggered on the activate event. The activate event occurs after the install event, and is used to clean up any old service worker caches.

```typescript
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
```

On activation if the "version" variable declared at the top of the service worker has been updated, any existing caches that do not match the new variable value will be deleted. This makes sure that the service worker is always using the latest cache values. The version variable acts as a cache bust when making changes to the service worker, after it has been previously deployed, otherwise the cached values will continue to be used until the service worker is no longer registered.

#### Service Worker fetch Event

After install and activation the service worker will listen for fetch events. In the fetch event listener function we can intercept responses and add them to the cache after the fetch response is complete, or the network can be bypassed and the response can be returned directly from the cache. The fetch event listener can be included below the activate event listener like this:

```typescript
self.addEventListener("fetch", function (event) {
  const request = event.request;

  // Always fetch non-GET requests from the network
  if (request.method !== "GET") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("/offline");
      }) as Promise<Response>
    );
    return;
  }
});
```

If the request is not a [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) request, for example it could be a [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) or [PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT) request, the service worker will always defer these requests to the network and the response is never cached. In the event that there is no network connection and the network request fails the service worker will return the offline page for any requests that are not GET requests.

##### Network First then Cache - HTML Caching Strategy

Any HTML request will use a network first then cache, caching strategy. This enables the latest version of the page to be requested from the origin server if there is a network connection. Without a network connection, the service worker will check if a prior version of an HTML page is available in the cache, and if not the offline page will be returned. Below the non-GET requests conditional block add this code to proxy HTML requests:

```typescript
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
          return response || caches.match("/offline");
        });
      }) as Promise<Response>
  );
  return;
}
```

##### Cache First then Network - non-HTML Caching Strategy

For non-HTML requests, first the cache is checked and if the resource is in the cache it will be returned. If the non-HTML requests is not in the cache it will be requested from the origin server as long as there is a network connection, and then the response will be added to the cache for future requests. Add this code below the code that handles HTML requests:

```typescript
// For non-HTML requests, look in the cache first, fall back to the network
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
          .catch(function () {
            // you can return an image placeholder here with
            if (request.headers.get("Accept")?.indexOf("image") !== -1) {
            }
          })
      );
    }) as Promise<Response>
  );
  return;
}
```

**NOTE**: If the request is for a plaintext resource it will be ignored by the service worker with this configuration. Additionally if request [Accept](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) header does not include "text/plain", but the response [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) header is of "text/plain" then the response will not be stored in the service worker cache. For any other response types like css, js, png, or jpg, the response will be cached by the service worker in this code section.

Here's what the entire service-worker.js file should look like will all the sections put together:

```typescript
/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type {};
declare const self: ServiceWorkerGlobalScope;

const cacheName = "::yourserviceworker";
const version = "v0.0.1";

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(version + cacheName).then(function (cache) {
      return cache.addAll(["/", "/offline"]);
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
        return caches.match("/offline");
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
            return response || caches.match("/offline");
          });
        }) as Promise<Response>
    );
    return;
  }

  // For non-HTML requests, look in the cache first, fall back to the network
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
            .catch(function () {
              // you can return an image placeholder here with
              if (request.headers.get("Accept")?.indexOf("image") !== -1) {
              }
            })
        );
      }) as Promise<Response>
    );
    return;
  }
});
```

### Test Service Worker Locally

You can test the service worker by running your project locally with the [http-server npm package](https://www.npmjs.com/package/http-server). First make sure to compile the TypeScript service worker code by using the command <kbd>npm run build-typecheck</kbd>. Then, to install the http-server npm package run the command <kbd>npm i http-server --save-dev</kbd>. After installing run the command <kbd>http-server</kbd> in your project folder where the index.html and offline.html pages are. You should then see your website in the browser by navigating to the default http-server url localhost:8080. With browser dev tools you can inspect your website including managing service worker installation state and cache status.

In Chrome this is in the "Application" tab of chrome DevTools:

![Chrome DevTools Application tab Service Worker information](/images/application-service-worker.png)

In the left hand navigation panel of the Application tab you can also see a section for "Cache Storage", and in the dropdown list should be an entry for the service worker, with the name you chose, listing all of the cached assets. There is three cached responses: the index.html page, the offline.html page, and the script.js file that registers the service worker.

Here's what that looks like in Chrome:

![Chrome DevTools Application tab Cache Storage](/images/application-cache-storage.png)

You can test offline mode by selecting the checkbox for "Offline" and deleting the cache item with name "/". Refreshing the page should load the offline.html since the index.html is no longer cached.

Your site can now support offline viewing for pages that are cached with the service worker, or show an offline page when there is no response previously cached and a network connection is unavailable.
