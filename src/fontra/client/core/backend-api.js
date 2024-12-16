import { getRemoteProxy } from "core/remote.js";
import { fetchJSON } from "./utils.js";
import { StaticGlyph } from "./var-glyph.js";
import { VarPackedPath } from "./var-path.js";

import { Font } from "fontrabak";

/** @import { RemoteFont } from "remotefont" */

/**
 * @module fontra/client/core/backend-api
 * @description
 * This module provides a class that can be used to interact with the backend API.
 * The default Fontra backend is the Python-based web server. This class provides
 * an abstraction over the functionality of the web server, so that alternative
 * backends can be used.
 *
 */
class AbstractBackend {
  /**
   * Get a list of projects from the backend.
   * @returns {Promise<string[]>} An array of project names.
   */
  static async getProjects() {}

  /**
   * Parse clipboard data.
   *
   * Returns a glyph object parsed from either a SVG string or an UFO .glif.
   * @param {string} data - The clipboard data.
   * @returns {Promise<StaticGlyph>} - The glyph object, if parsable.
   */
  static async parseClipboard(data) {}

  /**
   * Remove overlaps in a path
   *
   * In this and all following functions, the paths are represented as
   * JSON VarPackedPath objects; i.e. they have `coordinates`, `pointTypes`,
   * `contourInfo`, and `pointAttrbutes` fields.
   *
   * @param {VarPackedPath} path - The first path.
   * @returns {Promise<VarPackedPath>} The union of the two paths.
   */
  static async unionPath(path) {}

  /**
   * Subtract one path from another.
   * @param {VarPackedPath} pathA - The first path.
   * @param {VarPackedPath} pathB - The second path.
   * @returns {Promise<VarPackedPath>} The difference of the two paths.
   */
  static async subtractPath(pathA, pathB) {}

  /**
   * Intersect two paths.
   * @param {VarPackedPath} pathA - The first path.
   * @param {VarPackedPath} pathB - The second path.
   * @returns {Promise<VarPackedPath>} The intersection of the two paths.
   */
  static async intersectPath(pathA, pathB) {}

  /**
   * Exclude one path from another.
   * @param {VarPackedPath} pathA - The first path.
   * @param {VarPackedPath} pathB - The second path.
   * @returns {Promise<VarPackedPath>} The exclusion of the two paths.
   */
  static async excludePath(pathA, pathB) {}
}

class PythonBackend extends AbstractBackend {
  static async getProjects() {
    return fetchJSON("/projectlist");
  }

  static async _callServerAPI(functionName, kwargs) {
    const response = await fetch(`/api/${functionName}`, {
      method: "POST",
      body: JSON.stringify(kwargs),
    });

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.returnValue;
  }

  static async parseClipboard(data) {
    let result = await this._callServerAPI("parseClipboard", { data });
    return result ? StaticGlyph.fromObject(result) : undefined;
  }

  static async unionPath(path) {
    const newPath = await this._callServerAPI("unionPath", { path });
    return VarPackedPath.fromObject(newPath);
  }

  static async subtractPath(pathA, pathB) {
    const newPath = await this._callServerAPI("subtractPath", { pathA, pathB });
    return VarPackedPath.fromObject(newPath);
  }

  static async intersectPath(pathA, pathB) {
    const newPath = await this._callServerAPI("intersectPath", { pathA, pathB });
    return VarPackedPath.fromObject(newPath);
  }

  static async excludePath(pathA, pathB) {
    const newPath = await this._callServerAPI("excludePath", { pathA, pathB });
    return VarPackedPath.fromObject(newPath);
  }

  /**
   *
   * @param {string} projectPath
   * @returns {Promise<RemoteFont>} Proxy object representing a font on the server.
   */
  static async remoteFont(projectPath) {
    const protocol = window.location.protocol === "http:" ? "ws" : "wss";
    const wsURL = `${protocol}://${window.location.host}/websocket/${projectPath}`;
    return getRemoteProxy(wsURL);
  }
}

class DummyRemoteFont {
  getGlyphMap() {
    console.log("getGlyphMap called");
    let staticMap = { a: [61] };
    return Promise.resolve(staticMap);
  }
  getAxes() {
    return Promise.resolve({});
  }
  async getBackgroundImage(identifier) {
    let staticImage = {
      type: "png",
      data: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAFhSURBVDiNpZG9SgNREIW/2RtUbCwUwUoFX0ALtQgEQRArbQRRfIRUBjakWhGSbDCNla2Fv43gMyz4AykEEUEivoIgYYvsjs3uuqzRCJ5u5pz7zQwX/inp1bRte1VVC5ZlLYZhOCAit6rqNRqNK0B/BJRKpXFjzDmw9MPABxFZr9frb98AlUplIgiCV2Coz9ZdY8xstVp9BLDibhiGZ394DJALguDacZxcArBte01VC394HGva9/3dBCAiy2lXVZuq2oxrETlM11FmBSAXFQtpU0R2MuFNkW8fNpcAgLGMOd6nBhhJTgBaPQL99JwG3GVMX0ROInALOAW6mcx9ArAs6xjwU+aQqm6LyIeIdIAtvs6NdQBgADzP6+Tz+RdgIxOaAiazu4vIvuu6F+kTcF33ErB7n/slVT1qt9t7CSwbKJfLM6p6CMwDo1H7XVWfjDG7tVrtpt+QRMVicdBxnOHfMp/ku3fsRRY33AAAAABJRU5ErkJggg==",
    };
    return Promise.resolve(staticImage);
  }
  async putBackgroundImage(identifier, image) {
    return Promise.resolve({});
  }
  async getGlyph(glyphName) {
    let staticGlyph = {
      xAdvance: 500,
      anchors: [{ name: "top", x: 250, y: 250 }],
      guidelines: [],
      backgroundImage: {
        identifier: "test",
        transformation: {
          translateX: 50,
          translateY: 50,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          skewY: 0,
          tCenterX: 0,
          tCenterY: 0,
        },
        opacity: 0.5,
      },
      path: {
        coordinates: [
          443, -13, 443, 714, 375, 714, 375, 99, 276, 151, 246, 97, 88, 0, 156, 0, 156,
          615, 255, 563, 285, 617, 88, 727, 234, 267, 297, 267, 297, 447, 234, 447,
        ],
        pointTypes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        contourInfo: [
          { endPoint: 5, isClosed: true },
          { endPoint: 11, isClosed: true },
          { endPoint: 15, isClosed: true },
        ],
      },
    };
    let staticVarGlyph = {
      name: "a",
      sources: [{ name: "default", layerName: "default" }],
      layers: {
        default: { glyph: staticGlyph },
      },
    };
    return Promise.resolve(staticVarGlyph);
  }
  async getSources() {
    return Promise.resolve([
      {
        name: "Dummy",
        isSparse: false,
        location: { wght: 400 },
        italicAngle: 0,
        guidelines: [],
        customData: {},
      },
    ]);
  }
  async getUnitsPerEm() {
    return Promise.resolve(1000);
  }
  async isReadOnly() {
    return Promise.resolve(false);
  }
  async getBackEndInfo() {
    return Promise.resolve({ features: [], projectManagerFeatures: [] });
  }
  async getCustomData() {
    return Promise.resolve({});
  }
  async subscribeChanges(pathOrPattern, liveChanges) {
    return Promise.resolve({});
  }
  async unsubscribeChanges(pathOrPattern, wantLiveChanges) {
    return Promise.resolve({});
  }
  async editFinal(finalChange, rollbackChange, editLabel, broadcast) {
    return Promise.resolve({});
  }
  async editIncremental(change) {
    return Promise.resolve({});
  }
  async exportAs(options) {
    return Promise.resolve({});
  }
  async findGlyphsThatUseGlyph(glyphname) {
    return Promise.resolve([]);
  }
  async on(event, callback) {
    return;
  }
}

class DummyBackend extends AbstractBackend {
  static async getProjects() {
    return ["dummy.ufo"];
  }

  static async getSuggestedGlyphName(codePoint) {
    return "a";
  }

  static async getCodePointFromGlyphName(glyphName) {
    return 61;
  }

  static async parseClipboard(data) {
    return;
  }
  static async unionPath(path) {
    return path;
  }
  static async subtractPath(pathA, pathB) {
    return pathA;
  }
  static async intersectPath(pathA, pathB) {
    return pathA;
  }
  static async excludePath(pathA, pathB) {
    return pathA;
  }
  static async remoteFont(projectPath) {
    return new DummyRemoteFont();
  }
}

class RustBackend extends AbstractBackend {
  static async getProjects() {
    return ["dummy.ufo"];
  }

  static async getSuggestedGlyphName(codePoint) {
    return "a";
  }

  static async getCodePointFromGlyphName(glyphName) {
    return 61;
  }

  static async parseClipboard(data) {
    return;
  }
  static async unionPath(path) {
    return path;
  }
  static async subtractPath(pathA, pathB) {
    return pathA;
  }
  static async intersectPath(pathA, pathB) {
    return pathA;
  }
  static async excludePath(pathA, pathB) {
    return pathA;
  }
  static async remoteFont(projectPath) {
    console.log("URL", projectPath);
    return await fetch(projectPath)
      .then((result) => result.text())
      .then((glyphs) => new RustFont(glyphs));
  }
}

class RustFont {
  constructor(fontData) {
    console.log(Font);
    this.font = new Font(fontData);
  }
  on(event, callback) {
    this.font.on(event, callback);
  }
  getGlyphMap() {
    return this.font.getGlyphMap();
  }
  getAxes() {
    return this.font.getAxes();
  }
  async getBackgroundImage(identifier) {
    return this.font.getBackgroundImage(identifier);
  }
  async putBackgroundImage(identifier, image) {
    return this.font.putBackgroundImage(identifier, image);
  }
  async getGlyph(glyphName) {
    return this.font.getGlyph(glyphName);
  }
  async getSources() {
    return this.font.getSources();
  }
  async getUnitsPerEm() {
    return this.font.getUnitsPerEm();
  }
  async isReadOnly() {
    return this.font.isReadOnly();
  }
  async getBackEndInfo() {
    return this.font.getBackendInfo(); // Fix spelling...
  }
  async getCustomData() {
    return this.font.getCustomData();
  }
  async subscribeChanges(pathOrPattern, liveChanges) {
    // return this.font.subscribeChanges(pathOrPattern, liveChanges);
    return Promise.resolve({});
  }
  async unsubscribeChanges(pathOrPattern, wantLiveChanges) {
    return Promise.resolve({});
    // return this.font.unsubscribeChanges(pathOrPattern, wantLiveChanges);
  }
}
export const Backend = RustBackend;
// export const Backend = PythonBackend;
