// super light lodash replacements

const kebabCase = (str) =>
  str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const camelCase = (str) => str.replace(/-./g, (m) => m.toUpperCase()[1]);

const flow = (...fns) => (x) => fns.reduce((y, f) => f(y), x);

const intersection = (a, ...arr) =>
  [...new Set(a)].filter((v) => arr.every((b) => b.includes(v)));

// checks if str is empty AND checks if str is zero OR is a number
const strIsNum = (str) => str.trim() && (0 === +str || +str);
const asKey = (key) => (strIsNum(key) ? +key : key);

const get = (obj, path) =>
  path.split(".").reduce((acc, c) => acc && acc[c], obj);

const set = (obj, path, value) =>
  path
    .split(".")
    .reduce(
      (acc = {}, c, i, { length }) =>
        i + 1 === length ? (acc[c] = value) : c in acc ? acc[c] : (acc[c] = {}),
      obj
    );

const between = (start, end) => (str) =>
  str.substring(str.lastIndexOf(start) + 1, str.lastIndexOf(end));

const isElement = (el) => el instanceof Element || el instanceof HTMLDocument;

const cloneDeep = (obj, hash = new WeakMap()) => {
  if (Object(obj) !== obj) return obj; // primitives
  if (hash.has(obj)) return hash.get(obj); // cyclic reference
  const result =
    obj instanceof Set
      ? new Set(obj) // See note about this!
      : obj instanceof Map
      ? new Map(Array.from(obj, ([key, val]) => [key, cloneDeep(val, hash)]))
      : obj instanceof Date
      ? new Date(obj)
      : obj instanceof RegExp
      ? new RegExp(obj.source, obj.flags)
      : // ... add here any specific treatment for other classes ...
      // and finally a catch-all:
      obj.constructor
      ? new obj.constructor()
      : Object.create(null);
  hash.set(obj, result);
  return Object.assign(
    result,
    ...Object.keys(obj).map((key) => ({ [key]: cloneDeep(obj[key], hash) }))
  );
};
const isString = (str) => typeof str === "string" || str instanceof String;
const isArray = (arr) => Array.isArray(arr);

const isObject = (item) =>
  item && typeof item === "object" && !Array.isArray(item);

const merge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
};

const isEqual = (a, b) => {
  if (a === b) return true;

  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (a.constructor === RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString)
      return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0; ) {
      var key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
};

const flatten = (obj, path = []) => {
  return isObject(obj) || isArray(obj)
    ? Object.entries(obj).reduce(
        (acc, [k, v]) => merge(acc, flatten(v, [...path, k])),
        {}
      )
    : { [path.join(".")]: obj };
};

const unflatten = (obj) =>
  Object.entries(obj).reduce((acc, [k, v]) => set(k, v, acc), {});

const withDefault = (maybe, fallback) =>
  maybe === undefined ? fallback : maybe;

const identity = (x) => x;

const batch = queueMicrotask;
const queue = () => setTimeout(fn, 0);
const beforeFrame = requestAnimationFrame;
const afterFrame = (fn) => beforeFrame(queue(fn));
const nextFrame = (fn) => beforeFrame(beforeFrame(fn));
const idle = (fn) => requestIdleCallback(fn);

export {
  identity,
  batch,
  queue,
  beforeFrame,
  afterFrame,
  nextFrame,
  idle,
  withDefault,
  between,
  flatten,
  unflatten,
  kebabCase,
  camelCase,
  flow,
  intersection,
  get,
  set,
  isElement,
  cloneDeep,
  isObject,
  merge,
  isEqual,
  isString,
};
