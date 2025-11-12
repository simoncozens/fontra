import { setBackend } from "@fontra/core/backend-api.js";
import "@fontra/core/theme-settings.js";

import { EditorController } from "@fontra/views-editor/editor.js";

async function startApp() {
  const backend = localStorage.getItem("fontraBackend") || "python";

  setBackend(backend);
  window.editorController = await EditorController.fromBackend();
}

console.log("Starting");
startApp();
