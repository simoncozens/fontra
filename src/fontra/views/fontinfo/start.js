import { FontInfoController } from "./fontinfo.js";

async function startApp() {
  window.fontInfoController = await FontInfoController.fromBackend();
}

startApp();
