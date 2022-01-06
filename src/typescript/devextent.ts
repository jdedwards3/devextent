export default class DevExtent {
  constructor() {
    document
      .querySelectorAll("pre")
      .forEach((item) => item.setAttribute("tabindex", "0"));
  }
}
