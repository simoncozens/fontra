import { SimpleElement } from "@fontra/core/html-utils.js";
import { EditorController } from "./editor";

export default abstract class Panel extends SimpleElement {
  identifier: string;
  editorController: any;
  contentElement: HTMLElement;
  iconPath: string;

  constructor(editorController: EditorController) {
    super();
    this.editorController = editorController;
    this.contentElement = this.getContentElement();
    if (!this.contentElement) {
      throw new Error("Panel content element not found.");
    }
    this.shadowRoot.appendChild(this.contentElement);
  }

  abstract getContentElement(): HTMLElement;

  abstract toggle(on: boolean, focus: any): void;
}
