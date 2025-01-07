import { setBackend } from "core/backend-api.js";
import { EditorController } from "./editor.js";

async function startApp() {
  const backend = localStorage.getItem("fontraBackend") || "python";

  setBackend(backend);
  window.editorController = await EditorController.fromBackend();
}

console.log("Starting");
startApp();
