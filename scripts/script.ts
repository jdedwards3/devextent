export default class Main {
  constructor() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then(function () {
          console.log("Service Worker Registered");
        });
    }

    document
      .querySelectorAll("pre")
      .forEach((item) => item.setAttribute("tabindex", "0"));
  }
}

new Main();
