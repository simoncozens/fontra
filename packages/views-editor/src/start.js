import("@fontra/core/theme-settings.js");
import("@fontra/web-components/add-remove-buttons.js");
import("@fontra/web-components/designspace-location.js");
import("@fontra/web-components/glyph-search-list.js");
import("@fontra/web-components/grouped-settings.js");
import("@fontra/web-components/inline-svg.js");
import("@fontra/web-components/modal-dialog.js");
import("@fontra/web-components/ui-list.js");

import { EditorController } from "@fontra/views-editor/editor.js";

async function startApp() {
  window.editorController = await EditorController.fromBackend();
}

startApp();
