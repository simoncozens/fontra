import { setBackend } from "core/backend-api.js";
import { FontInfoController } from "./fontinfo.js";

async function startApp() {
  const backend = localStorage.getItem("fontraBackend") || "python";

  setBackend(backend);
  window.fontInfoController = await FontInfoController.fromBackend();
}

startApp();
