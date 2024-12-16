import { EditorController } from "./editor.js";

async function startApp() {
  window.editorController = await EditorController.fromBackend();
}

console.log("Starting");
startApp();
