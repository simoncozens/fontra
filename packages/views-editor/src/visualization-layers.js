"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.VisualizationLayers = void 0;
var utils_js_1 = require("@fontra/core/utils.js");
var var_funcs_1 = require("@fontra/core/var-funcs");
var scene_controller_js_1 = require("./scene-controller.js");
var SelectionMode;
(function (SelectionMode) {
    SelectionMode["ALL"] = "all";
    SelectionMode["UNSELECTED"] = "unselected";
    SelectionMode["HOVERED"] = "hovered";
    SelectionMode["SELECTED"] = "selected";
    SelectionMode["EDITING"] = "editing";
    SelectionMode["NOTEDITING"] = "notediting";
})(SelectionMode || (SelectionMode = {}));
var VisualizationLayers = /** @class */ (function () {
    function VisualizationLayers(definitions, darkTheme) {
        var _this = this;
        this.definitions = definitions;
        this._darkTheme = darkTheme;
        this._scaleFactor = 1;
        this._visibleLayerIds = new Set(this.definitions
            .filter(function (layer) { return !layer.userSwitchable || layer.defaultOn; })
            .map(function (layer) { return layer.identifier; }));
        this.requestUpdate = utils_js_1.consolidateCalls(function () { return _this.buildLayers(); });
    }
    Object.defineProperty(VisualizationLayers.prototype, "darkTheme", {
        get: function () {
            return this._darkTheme;
        },
        set: function (darkTheme) {
            this._darkTheme = darkTheme;
            this.requestUpdate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisualizationLayers.prototype, "scaleFactor", {
        get: function () {
            return this._scaleFactor;
        },
        set: function (scaleFactor) {
            this._scaleFactor = scaleFactor;
            this.requestUpdate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisualizationLayers.prototype, "visibleLayerIds", {
        get: function () {
            return this._visibleLayerIds;
        },
        set: function (visibleLayerIds) {
            this._visibleLayerIds = visibleLayerIds;
            this.requestUpdate();
        },
        enumerable: false,
        configurable: true
    });
    VisualizationLayers.prototype.toggle = function (layerID, onOff) {
        if (onOff) {
            this._visibleLayerIds.add(layerID);
        }
        else {
            this._visibleLayerIds["delete"](layerID);
        }
        this.requestUpdate();
    };
    VisualizationLayers.prototype.buildLayers = function () {
        var layers = [];
        for (var _i = 0, _a = this.definitions; _i < _a.length; _i++) {
            var layerDef = _a[_i];
            if (!this.visibleLayerIds.has(layerDef.identifier)) {
                continue;
            }
            var parameters = __assign(__assign(__assign(__assign({}, var_funcs_1.mulScalar(layerDef.screenParameters || {}, this.scaleFactor)), (layerDef.glyphParameters || {})), (layerDef.colors || {})), (this.darkTheme && layerDef.colorsDarkMode ? layerDef.colorsDarkMode : {}));
            var layer = {
                selectionMode: layerDef.selectionMode,
                selectionFilter: layerDef.selectionFilter,
                parameters: parameters,
                draw: layerDef.draw
            };
            layers.push(layer);
        }
        this.layers = layers;
    };
    VisualizationLayers.prototype.drawVisualizationLayers = function (model, controller) {
        if (!this.layers) {
            this.buildLayers();
        }
        var glyphsBySelectionMode = getGlyphsBySelectionMode(model);
        var context = controller.context;
        var _loop_1 = function (layer) {
            var glyphs = layer.selectionFilter
                ? glyphsBySelectionMode[layer.selectionMode].filter(layer.selectionFilter)
                : glyphsBySelectionMode[layer.selectionMode];
            var _loop_2 = function (positionedGlyph) {
                utils_js_1.withSavedState(context, function () {
                    context.translate(positionedGlyph.x, positionedGlyph.y);
                    layer.draw(context, positionedGlyph, layer.parameters, model, controller);
                });
            };
            for (var _b = 0, glyphs_1 = glyphs; _b < glyphs_1.length; _b++) {
                var positionedGlyph = glyphs_1[_b];
                _loop_2(positionedGlyph);
            }
        };
        for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            _loop_1(layer);
        }
    };
    return VisualizationLayers;
}());
exports.VisualizationLayers = VisualizationLayers;
function getGlyphsBySelectionMode(model) {
    var _a;
    var selectedPositionedGlyph = model.getSelectedPositionedGlyph();
    var allPositionedGlyphs = model.positionedLines.flatMap(function (line) { return line.glyphs; });
    return {
        all: allPositionedGlyphs,
        unselected: allPositionedGlyphs.filter(function (glyph) { return glyph !== selectedPositionedGlyph; }),
        hovered: model.hoveredGlyph &&
            !scene_controller_js_1.equalGlyphSelection(model.hoveredGlyph, model.selectedGlyph)
            ? hoveredGlyphs(model)
            : [],
        selected: model.selectedGlyph && !model.selectedGlyph.isEditing
            ? selectedGlyphs(model)
            : [],
        editing: ((_a = model.selectedGlyph) === null || _a === void 0 ? void 0 : _a.isEditing) ? selectedGlyphs(model) : [],
        notediting: allPositionedGlyphs.filter(function (glyph) { var _a; return glyph !== selectedPositionedGlyph || !((_a = model.selectedGlyph) === null || _a === void 0 ? void 0 : _a.isEditing); })
    };
}
function hoveredGlyphs(model) {
    var glyph = model.getHoveredPositionedGlyph();
    return glyph ? [glyph] : [];
}
function selectedGlyphs(model) {
    var glyph = model.getSelectedPositionedGlyph();
    return glyph ? [glyph] : [];
}
