import { isElement, intersection } from "../internals/tiny.js";
import { config } from "./../config/default.js";

const noop = () => {};
const watchOpts = {
  subtree: true,
  childList: true,
  attributes: true,
  //   attributeFilter: false,
  //   attributeOldValue: false,
  //   characterData: false,
  //   characterDataOldValue: false,
};

const mutsAsEls = (callback = noop) => (mutations) =>
  mutations.forEach((mutation) =>
    [mutation.target, ...mutation.addedNodes].forEach((node) =>
      // Makes a microtask
      Promise.resolve().then(() =>
        callback(isElement(node) ? node : node.parentElement)
      )
    )
  );

const watch = (callback = noop) => new MutationObserver(mutsAsEls(callback));

const monitor = (root = document, callback = noop, opts = watchOpts) =>
  watch(callback).observe(root, opts);

// can be throughly improved with a good map;
// pushCodecClosureMap.get(path)(val);
const pull = (me) => (el) => {
  // find all codecs.
  const codecs = intersection(Object.keys(el.dataset), Object.keys(me.codecs));

  codecs.forEach((codec) => {
    const path = el.dataset[codec];
    const pullWith = me.codecs[codec].pull;
    const domVal = pullWith(el);
    const dataVal = me.resolver(path);
    domVal === dataVal || me.resolver(path, domVal);
  });
};

// opinionated config for Adios
// takes me
// updates dom from to me.config.root || document
// puts proxy at .is
const puller = (me = config) => {
  me.puller = pull(me);
  me.pull = () => me.util.elements().forEach(me.puller);
  me.domobs = monitor(document, me.puller, watchOpts);
  me.pull();
  return me;
};

export { puller, pull, monitor, watch };
