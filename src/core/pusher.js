import {
  cloneDeep,
  merge,
  get,
  set,
  isEqual,
  flatten,
} from "../internals/tiny.js";
import prox from "./../internals/prox.js";
// import prox from 'https://cdn.skypack.dev/observable-slim';
import { config } from "./../config/default.js";

const noop = () => {};

const watch = (target = {}, callback = noop, path = []) =>
  prox().create(target, callback);

const be = (rawObj, proxy) => (...args) => {
  const switcher = {
    0: () => cloneDeep(rawObj),
    1: (newObj) => merge(newObj, proxy),
    2: (path, newObj) => merge(newObj, get(path, proxy)),
  };
  return switcher[args.length](...args);
};

const monitor = (
  me = {},
  callback = noop,
  path = false,
  method = false,
  raw = false
) => {
  // if path and raw is falsey provide an empty object to start
  const rawObj = get(me, path) || get(me, raw) || {};

  // create nested proxy, provide an the callback.
  const proxy = watch(rawObj, callback);

  // store the proxied data somewhere in the passed obj
  raw && set(me, raw, rawObj);

  // create method interface for proxy and raw data
  method && set(me, method, be(rawObj, proxy));

  // me now has the nested proxy at the path,
  // with the callback firing when a value is updated.
  path && set(me, path, proxy);
  // return the mutated me
  return proxy;
};

// can be throughly improved with a good map;
// pushCodecClosureMap.get(path)(val);
const push = (me) => (path = "") => {
  console.log({ path, be: me.be() });
  const els = me.util.elements(path, true);
  // console.log("Relevant:", { type, usePath, isUpdate, els });
  // push updates to each codec on element
  const pushToCodec = (el) => (_codec) => {
    const value = el.dataset[_codec] && me.resolver(el.dataset[_codec]);
    const pushToView = () => {
      const closure = me.codecs[_codec].push(el, value);
      // console.log({ _codec, path, value });
      requestAnimationFrame(closure);
    };
    undefined !== value && queueMicrotask(pushToView);
  };
  // will be false if codec doesn't exist AND path doesn't match
  const isRelevant = (_codec) => _codec in me.codecs;
  // push updates to each element
  const pushToElement = (el) =>
    Object.keys(el.dataset).filter(isRelevant).forEach(pushToCodec(el));
  els.forEach(pushToElement);
};

// opinionated config for Adios
// takes me
// updates dom from to me.config.root || document
// puts proxy at .is
const pusher = (me = config) => {
  me.pushSet = new Set();
  me.pusher = (changes) =>
    changes.forEach(({ currentPath }) => push(me)(currentPath));
  me.push = push(me);
  monitor(me, me.pusher, "is", "be", "util.raw");
  return me;
};

export { pusher, push, monitor, watch };
