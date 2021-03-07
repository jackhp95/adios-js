import {
  cloneDeep,
  merge,
  get,
  set,
  isEqual,
  flatten,
} from "../internals/tiny.js";
// import prox from "./../internals/prox.js";
import prox from 'https://cdn.skypack.dev/observable-slim';
import { config } from "./../config/default.js";

const noop = () => {};

const watch = (target = {}, callback = noop, path = []) =>
  prox.create(target, false, callback);

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
const push = (me) => (changes = [{}]) => {
  // console.log(changes);
  changes.forEach(({ currentPath, newValue, type } = {}) => {
    // find all elements with the path that's being updated.
    const updatePath = currentPath;
    const addPath = () => currentPath.split(".").slice(0, -1).join(".");
    const isUpdate = type === "update" || type === undefined;
    const usePath = isUpdate ? updatePath : addPath();
    const els = me.util.elements(usePath, !isUpdate);
    // console.log("Relevant:", { type, usePath, isUpdate, els });
    // push updates to each codec on element
    const pushToCodec = (el) => ([_codec]) => {
      const pullWith = me.codecs[_codec].pull;
      const isEq = isEqual(newValue, pullWith(el));
      const pushToView = () => {
        // requestAnimationFrame(() => {
        // with list-codec, adding data doesn't affect the list itself, only adds an item.
        // this means we need to pop one off the given path, to account for added values
        // because you can't safely assume that the value passed in will map to the relevant paths
        // you must resolve the value from the resolver on the element in question.
        const pathToResolve = el.dataset[_codec];
        const resolvedValue = me.resolver(pathToResolve);
        const provideValue =
          resolvedValue === undefined ? newValue : resolvedValue;
        // console.log("Pushing", { el, _codec, pathToResolve, provideValue });
        me.codecs[_codec].push(el, provideValue);
        // });
      };
      isEq || pushToView();
    };
    // will be false if codec doesn't exist AND path doesn't match
    const isRelevant = ([_codec, _path]) => {
      const relevant = usePath
        ? [
            me.codecs[_codec], // codec exists
            // if updating data,
            isUpdate
              ? // check if path matches,
                usePath === _path
              : // otherwise if data structure changes
                // check path starts with the same value as
                // the path you've added data to
                _path.startsWith(usePath),
          ].every((x) => x)
        : // if theres no path, everything is relevant,
          me.codecs[_codec]; // codec exists
      // console.log({ _codec, _path, usePath, relevant });
      return relevant;
    };
    // push updates to each element
    const pushToElement = (el) =>
      Object.entries(el.dataset).filter(isRelevant).forEach(pushToCodec(el));
    els.forEach(pushToElement);
  });
};


// opinionated config for Adios
// takes me
// updates dom from to me.config.root || document
// puts proxy at .is
const pusher = (me = config) => {
  me.pusher = push(me);
  me.push = () => me.pusher();
  monitor(me, me.pusher, "is", "be", "util.raw");
  return me;
};

export { pusher, push, monitor, watch };
