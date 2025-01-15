import { consolidateCalls, withSavedState } from "@fontra/core/utils.js";
import { mulScalar } from "@fontra/core/var-funcs.ts";
import { equalGlyphSelection } from "./scene-controller.js";
import { SceneModel } from "./scene-model.js";

enum SelectionMode {
  ALL = "all",
  UNSELECTED = "unselected",
  HOVERED = "hovered",
  SELECTED = "selected",
  EDITING = "editing",
  NOTEDITING = "notediting",
}

type DrawFunction = (
  context: object,
  positionedGlyph: object,
  parameters: object,
  model: object,
  controller: object
) => void;

interface LayerDefinition {
  identifier: string;
  name: string;
  selectionMode: SelectionMode;
  userSwitchable: boolean;
  defaultOn: boolean;
  zIndex: number;
  dontTranslate: boolean;
  screenParameters: object;
  glyphParameters?: object;
  colors: object;
  colorsDarkMode: object;
  selectionFilter: (glyph: object) => boolean;
  draw: DrawFunction;
}

interface Layer {
  selectionMode: SelectionMode;
  selectionFilter: (glyph: object) => boolean;
  parameters: any;
  draw: DrawFunction;
}

export class VisualizationLayers {
  definitions: LayerDefinition[];
  private _darkTheme: boolean;
  private _scaleFactor: number;
  private _visibleLayerIds: Set<string>;
  requestUpdate: () => void;
  layers: Layer[];

  constructor(definitions: LayerDefinition[], darkTheme: boolean) {
    this.definitions = definitions;
    this._darkTheme = darkTheme;
    this._scaleFactor = 1;
    this._visibleLayerIds = new Set(
      this.definitions
        .filter((layer) => !layer.userSwitchable || layer.defaultOn)
        .map((layer) => layer.identifier)
    );
    this.requestUpdate = consolidateCalls(() => this.buildLayers());
  }

  get darkTheme() {
    return this._darkTheme;
  }

  set darkTheme(darkTheme) {
    this._darkTheme = darkTheme;
    this.requestUpdate();
  }

  get scaleFactor() {
    return this._scaleFactor;
  }

  set scaleFactor(scaleFactor) {
    this._scaleFactor = scaleFactor;
    this.requestUpdate();
  }

  get visibleLayerIds() {
    return this._visibleLayerIds;
  }

  set visibleLayerIds(visibleLayerIds) {
    this._visibleLayerIds = visibleLayerIds;
    this.requestUpdate();
  }

  toggle(layerID: string, onOff: boolean) {
    if (onOff) {
      this._visibleLayerIds.add(layerID);
    } else {
      this._visibleLayerIds.delete(layerID);
    }
    this.requestUpdate();
  }

  buildLayers() {
    const layers = [];
    for (const layerDef of this.definitions) {
      if (!this.visibleLayerIds.has(layerDef.identifier)) {
        continue;
      }
      const parameters = {
        ...mulScalar(layerDef.screenParameters || {}, this.scaleFactor),
        ...(layerDef.glyphParameters || {}),
        ...(layerDef.colors || {}),
        ...(this.darkTheme && layerDef.colorsDarkMode ? layerDef.colorsDarkMode : {}),
      };
      const layer = {
        selectionMode: layerDef.selectionMode,
        selectionFilter: layerDef.selectionFilter,
        parameters: parameters,
        draw: layerDef.draw,
      };
      layers.push(layer);
    }
    this.layers = layers;
  }

  drawVisualizationLayers(model: SceneModel, controller: any) {
    if (!this.layers) {
      this.buildLayers();
    }
    const glyphsBySelectionMode = getGlyphsBySelectionMode(model);
    const context = controller.context;
    for (const layer of this.layers) {
      const glyphs = layer.selectionFilter
        ? glyphsBySelectionMode[layer.selectionMode].filter(layer.selectionFilter)
        : glyphsBySelectionMode[layer.selectionMode];
      for (const positionedGlyph of glyphs) {
        withSavedState(context, () => {
          context.translate(positionedGlyph.x, positionedGlyph.y);
          layer.draw(context, positionedGlyph, layer.parameters, model, controller);
        });
      }
    }
  }
}

function getGlyphsBySelectionMode(model: any) {
  const selectedPositionedGlyph = model.getSelectedPositionedGlyph();
  const allPositionedGlyphs = model.positionedLines.flatMap((line: any) => line.glyphs);
  return {
    all: allPositionedGlyphs,
    unselected: allPositionedGlyphs.filter(
      (glyph: any) => glyph !== selectedPositionedGlyph
    ),
    hovered:
      model.hoveredGlyph &&
      !equalGlyphSelection(model.hoveredGlyph, model.selectedGlyph)
        ? hoveredGlyphs(model)
        : [],
    selected:
      model.selectedGlyph && !model.selectedGlyph.isEditing
        ? selectedGlyphs(model)
        : [],
    editing: model.selectedGlyph?.isEditing ? selectedGlyphs(model) : [],
    notediting: allPositionedGlyphs.filter(
      (glyph: any) =>
        glyph !== selectedPositionedGlyph || !model.selectedGlyph?.isEditing
    ),
  };
}

function hoveredGlyphs(model: SceneModel) {
  const glyph = model.getHoveredPositionedGlyph();
  return glyph ? [glyph] : [];
}

function selectedGlyphs(model: SceneModel) {
  const glyph = model.getSelectedPositionedGlyph();
  return glyph ? [glyph] : [];
}
