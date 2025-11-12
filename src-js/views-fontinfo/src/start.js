import { setBackend } from "@fontra/core/backend-api.js";
import "@fontra/core/theme-settings.js";

import { FontInfoController } from "@fontra/views-fontinfo/fontinfo.js";

async function startApp() {
  const backend = localStorage.getItem("fontraBackend") || "python";

  setBackend(backend);
  window.fontInfoController = await FontInfoController.fromBackend();
}

startApp();
