export default class Main {
  constructor() {
    document
      .querySelectorAll("pre")
      .forEach((item) => item.setAttribute("tabindex", "0"));
  }
}

new Main();
