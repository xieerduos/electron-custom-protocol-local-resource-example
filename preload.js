const { ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", async () => {
  const imageUrl = await ipcRenderer.invoke("get-image-path");
  console.log("imageUrl", imageUrl);
  const el = document.querySelector("#app");
  el.innerHTML = `<img style="width: 100vw" src="local-resource://${imageUrl}" />`;
});
