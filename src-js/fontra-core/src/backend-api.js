/**
 * @module fontra/client/core/backend-api
 * @description
 * This module provides a class that can be used to interact with the backend API.
 * The default Fontra backend is the Python-based web server. This class provides
 * an abstraction over the functionality of the web server, so that alternative
 * backends can be used.
 *
 */

import { getRemoteProxy } from "@fontra/core/remote.js";
import { fetchJSON } from "./utils.js";
import { StaticGlyph } from "./var-glyph.js";
import { VarPackedPath } from "./var-path.js";

import { Font } from "fontrabak";

/**
 * A class that provides an abstraction over the functionality of different Fontra
 * backends. This class is abstract and should be subclassed to provide a concrete
 * implementation.
 */
export class AbstractBackend {
  /**
   *
   * @param {*} args Backend-specific arguments.
   */
  constructor(args) {
    this.args = args;
  }

  /**
   * Get a list of projects from the backend.
   * @static
   * @abstract
   * @returns {Promise<string[]>} An array of project names.
   */
  async getProjects() {}

  /**
   * Obtain the user's selected project path.
   * @abstract
   * @returns {string} The project path.
   */
  getProjectPath() {}

  /**
   * Get information about the server.
   * @abstract
   * @returns {Promise<ServerInfo>} Information about the server.
   */
  async getServerInfo() {}
  /**
   * Get a suggested glyph name for a given code point.
   * @param {number} codePoint - The code point.
   * @returns {Promise<string>} The suggested glyph name.
   */
  async getSuggestedGlyphName(codePoint) {}

  /**
   * Get the code point for a given glyph name.
   * @param {string} glyphName - The glyph name.
   * @returns {Promise<number>} The code point.
   */
  async getCodePointFromGlyphName(glyphName) {}

  /**
   * Parse clipboard data.
   *
   * Returns a glyph object parsed from either a SVG string or an UFO .glif.
   * @param {string} data - The clipboard data.
   * @returns {Promise<StaticGlyph>} - The glyph object, if parsable.
   */
  async parseClipboard(data) {}

  /**
   * Remove overlaps in a path
   *
   * In this and all following functions, the paths are represented as
   * JSON VarPackedPath objects; i.e. they have `coordinates`, `pointTypes`,
   * `contourInfo`, and `pointAttrbutes` fields.
   *
   * @abstract
   * @param {VarPackedPath} path - The first path.
   * @returns {Promise<VarPackedPath>} The union of the two paths.
   */
  async unionPath(path) {}

  /**
   * Subtract one path from another.
   * @abstract
   * @param {VarPackedPath} pathA - The first path.
   * @param {VarPackedPath} pathB - The second path.
   * @returns {Promise<VarPackedPath>} The difference of the two paths.
   */
  async subtractPath(pathA, pathB) {}

  /**
   * Intersect two paths.
   * @abstract
   * @param {VarPackedPath} pathA - The first path.
   * @param {VarPackedPath} pathB - The second path.
   * @returns {Promise<VarPackedPath>} The intersection of the two paths.
   */
  async intersectPath(pathA, pathB) {}

  /**
   * Exclude one path from another.
   * @abstract
   * @param {VarPackedPath} pathA - The first path.
   * @param {VarPackedPath} pathB - The second path.
   * @returns {Promise<VarPackedPath>} The exclusion of the two paths.
   */
  async excludePath(pathA, pathB) {}
}

class PythonBackend extends AbstractBackend {
  async getProjects() {
    return fetchJSON(this.server(false) + "/projectlist");
  }

  async getServerInfo() {
    return fetchJSON(this.server(false) + "/serverinfo");
  }

  getProjectPath() {
    return window.location.pathname.split("/").slice(3).join("/");
  }

  async _callServerAPI(functionName, kwargs) {
    const response = await fetch(this.server(false) + `/api/${functionName}`, {
      method: "POST",
      body: JSON.stringify(kwargs),
    });

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.returnValue;
  }

  async getSuggestedGlyphName(codePoint) {
    return await this._callServerAPI("getSuggestedGlyphName", { codePoint });
  }

  async getCodePointFromGlyphName(glyphName) {
    return await this._callServerAPI("getCodePointFromGlyphName", { glyphName });
  }

  async parseClipboard(data) {
    let result = await this._callServerAPI("parseClipboard", { data });
    return result ? StaticGlyph.fromObject(result) : undefined;
  }

  async unionPath(path) {
    const newPath = await this._callServerAPI("unionPath", { path });
    return VarPackedPath.fromObject(newPath);
  }

  async subtractPath(pathA, pathB) {
    const newPath = await this._callServerAPI("subtractPath", { pathA, pathB });
    return VarPackedPath.fromObject(newPath);
  }

  async intersectPath(pathA, pathB) {
    const newPath = await this._callServerAPI("intersectPath", { pathA, pathB });
    return VarPackedPath.fromObject(newPath);
  }

  async excludePath(pathA, pathB) {
    const newPath = await this._callServerAPI("excludePath", { pathA, pathB });
    return VarPackedPath.fromObject(newPath);
  }

  /**
   *
   * @param {string} projectPath
   * @returns {Promise<RemoteFont>} Proxy object representing a font on the server.
   */
  async remoteFont(projectPath) {
    const wsURL = `${this.server(true)}/websocket/${projectPath}`;
    return getRemoteProxy(wsURL);
  }

  server(websocket) {
    const protocol = websocket
      ? this.args.secure
        ? "wss"
        : "ws"
      : this.args.secure
      ? "https"
      : "http";
    console.log(this.args.secure, protocol);
    return `${protocol}://${this.args.host}:${this.args.port}`;
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
  async getProjects() {
    return ["dummy.ufo"];
  }

  async getSuggestedGlyphName(codePoint) {
    return "a";
  }

  async getCodePointFromGlyphName(glyphName) {
    return 61;
  }

  async parseClipboard(data) {
    return;
  }
  async unionPath(path) {
    return path;
  }
  async subtractPath(pathA, pathB) {
    return pathA;
  }
  async intersectPath(pathA, pathB) {
    return pathA;
  }
  async excludePath(pathA, pathB) {
    return pathA;
  }
  async remoteFont(projectPath) {
    return new DummyRemoteFont();
  }
}

class RustBackend extends AbstractBackend {
  async getProjects() {
    return ["dummy.ufo"];
  }

  getProjectPath() {
    return window.location.search.split("?")[1] || null;
  }

  async getServerInfo() {
    return Promise.resolve({
      "Fontra Version": "0.1.0",
      "Python Version": "This is Rust, my friend",
      "Startup time": "Instantaneous",
      "View plugins": ["editor", "fontinfo", "applicationsettings"],
      "Project Manager": "THE INTERWEBZ",
    });
  }

  async getSuggestedGlyphName(codePoint) {
    return "a";
  }

  async getCodePointFromGlyphName(glyphName) {
    return 61;
  }

  async parseClipboard(data) {
    return;
  }
  async unionPath(path) {
    return path;
  }
  async subtractPath(pathA, pathB) {
    return pathA;
  }
  async intersectPath(pathA, pathB) {
    return pathA;
  }
  async excludePath(pathA, pathB) {
    return pathA;
  }
  async remoteFont(projectPath) {
    if (projectPath) {
      return await fetch(projectPath)
        .then((result) => result.text())
        .then((glyphs) => new RustFont(glyphs));
    } else {
      return new RustFont();
    }
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
    return this.font.getBackEndInfo();
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
  async editFinal(finalChange, rollbackChange, editLabel, broadcast) {
    console.log("Edit final: ", finalChange, rollbackChange, editLabel, broadcast);
    return Promise.resolve({});
  }
  async editIncremental(change) {
    return Promise.resolve({});
  }

  async getFontInfo() {
    return this.font.getFontInfo();
  }

  async exportAs(options) {
    return this.font.exportAs(options);
  }
}

/** @type {AbstractBackend} */
export let Backend;

export function setBackend(backend, args) {
  if (backend == "rust") {
    Backend = new RustBackend(args);
  } else if (backend == "dummy") {
    Backend = new DummyBackend(args);
  } else if (backend == "python") {
    Backend = new PythonBackend(args);
  } else {
    throw new Error(`Unknown backend: ${backend}`);
  }
  console.log(Backend, Backend.args);
}

let argsText =
  localStorage.getItem("fontraBackendArgs") ||
  '{"host": "localhost", "port": 8000, "secure": false}';
let args = JSON.parse(argsText);
setBackend(localStorage.getItem("fontraBackend") || "python", args);
