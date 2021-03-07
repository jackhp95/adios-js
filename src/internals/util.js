import {kebabCase, camelCase} from "./tiny.js"


// Internal Utils
const typeOfObj = (arg) => {
  const element = arg instanceof HTMLElement && "element";
  const node = arg instanceof Node && "element";
  const array = arg instanceof HTMLElement && "array";
  const isNull = arg === null && "null";
  return isNull || element || node || array || "object";
};
const typer = (arg) => {
  const kind = typeof arg;
  return kind === "object" ? typeOfObj(arg) : kind;
};
const argo = (config) => (...args) => config[typer(args[0])](...args);

// Exposed Utils
const selectors = (me = {}) => {
  const asVal = (path, startsWith = false) =>
    path ? (startsWith ? `^="${path}"` : `="${path}"`) : "";
  // provides selector for all adios elements
  const all = () => Object.keys(me.codecs).map(codec).join(",");
  // provides selector for all elements using given codec
  const codec = (c) => `[data-${me.util.asAttr(c)}]`;
  // provides selector for all elements using given path
  const path = (p, startsWith) =>
    Object.keys(me.codecs)
      .map((c) => `[data-${me.util.asAttr(c)}${asVal(p, startsWith)}]`)
      .join(",");
  // provides selector for all elements using the same paths as the given element.
  const element = (el) => Object.values(el.dataset).map(path).join(",");
  const fn = argo({
    undefined: all,
    element: element,
    string: path,
    object: codec,
  });
  const methods = { element, path, codec, all };
  me.util.selectors = Object.assign(fn, methods);
  return me;
};

const elements = (me = {}) => {
  const root = me?.config?.root || document;
  const sels = me.util.selectors;
  const all = (...args) => [...root.querySelectorAll(sels.all(...args))];
  const codec = (...args) => [...root.querySelectorAll(sels.codec(...args))];
  const path = (...args) => [...root.querySelectorAll(sels.path(...args))];
  const element = (...args) => [
    ...root.querySelectorAll(sels.element(...args)),
  ];
  const fn = (...args) => [...root.querySelectorAll(sels(...args))];
  const methods = { element, path, codec, all };
  me.util.elements = Object.assign(fn, methods);
  return me;
};

const util = (me = {}) => {
  me.util = me.util || {};
  me.util.asAttr = kebabCase;
  me.util.asProp = camelCase;
  selectors(me);
  elements(me);
  me.util.hide = (el) => el.hidden = true;
  me.util.show = (el) => el.hidden = false;
  return me;
};

export { util };
