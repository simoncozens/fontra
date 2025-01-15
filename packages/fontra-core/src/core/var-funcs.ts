import { VariationError } from "./errors.js";

interface Itemwise {
  addItemwise: (b: object) => object;
  subItemwise: (a: object) => object;
}
function isItemwise(object: any): object is Itemwise {
  return "addItemwise" in object && "subItemwise" in object;
}
interface ScalarMultiplication {
  mulScalar: (b: object) => object;
}
function supportsScalarMultiplication(object: any): object is ScalarMultiplication {
  return "mulScalar" in object;
}

export function addItemwise(a: object, b: object) {
  if (typeof a !== typeof b) {
    throw new VariationError(`incompatible object types: typeof ${a} != typeof ${b}`);
  } else if (typeof a === "string") {
    if (a !== b) {
      throw new VariationError(`unexpected different strings: ${a} != ${b}`);
    }
    return a;
  } else if (typeof a === "number") {
    return a + b;
  } else if (typeof a === "boolean") {
    if (a !== b) {
      throw new VariationError(`unexpected different booleans: ${a} != ${b}`);
    }
    return a;
  } else if (a === undefined && b === undefined) {
    return undefined;
  } else if (a === null && b === null) {
    return null;
  } else if (isItemwise(a)) {
    return a.addItemwise(b);
  }
  return itemwiseFunc(a, b, addItemwise);
}

export function subItemwise(a: object, b: object) {
  if (typeof a !== typeof b) {
    throw new VariationError(`incompatible object types: typeof ${a} != typeof ${b}`);
  } else if (typeof a === "string") {
    if (a !== b) {
      throw new VariationError(`unexpected different strings: ${a} != ${b}`);
    }
    return a;
  } else if (typeof a === "number" && typeof b === "number") {
    return a - b;
  } else if (typeof a === "boolean") {
    if (a !== b) {
      throw new VariationError(`unexpected different booleans: ${a} != ${b}`);
    }
    return a;
  } else if (a === undefined && b === undefined) {
    return undefined;
  } else if (a === null && b === null) {
    return null;
  } else if (isItemwise(a)) {
    return a.subItemwise(b);
  }
  return itemwiseFunc(a, b, subItemwise);
}

export function mulScalar(o: object, scalar: any) {
  if (scalar === 1 || typeof o === "string" || typeof o === "boolean") {
    return o;
  } else if (typeof o === "number") {
    return o * scalar;
  } else if (o === undefined) {
    return undefined;
  } else if (o === null) {
    return null;
  } else if (supportsScalarMultiplication(o)) {
    return o.mulScalar(scalar);
  }
  return objectMap(o, scalar, mulScalar);
}

function itemwiseFunc(a: object, b: object, func: (a: object, b: object) => object) {
  var result;
  if (Array.isArray(a) && Array.isArray(b)) {
    result = new Array(a.length);
    if (a.length != b.length) {
      throw new VariationError(
        `arrays have incompatible lengths: ${a.length} != ${b.length}`
      );
    }
    for (let i = 0; i < a.length; i++) {
      result[i] = func(a[i], b[i]);
    }
  } else {
    // @ts-ignore
    result = new a.constructor();
    const keys = Object.keys(a);
    if (keys.length != Object.keys(b).length) {
      // console.log("--> a", a);
      // console.log("--> b", b);
      throw new VariationError(
        `objects have incompatible number of entries: ${keys.length} != ${
          Object.keys(b).length
        }`
      );
    }
    for (const key of keys) {
      // @ts-ignore
      const valueA = a[key];
      // @ts-ignore
      const valueB = b[key];
      if ((valueA === undefined) !== (valueB === undefined)) {
        throw new VariationError(
          `objects have incompatible key sets: ${keys} != ${Object.keys(b)}`
        );
      }
      result[key] = func(valueA, valueB);
    }
  }
  return result;
}

function objectMap(
  o: object,
  argument: any,
  func: (o: object, argument: any) => object
) {
  var result;
  if (Array.isArray(o)) {
    return o.map((item) => func(item, argument));
  } else {
    // @ts-ignore
    result = new o.constructor();
    for (const key of Object.keys(o)) {
      // @ts-ignore
      result[key] = func(o[key], argument);
    }
  }
  return result;
}
