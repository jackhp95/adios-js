import { flow, isObject, merge } from "./internals/tiny.js";
import { pusher } from "./core/pusher.js";
import { puller } from "./core/puller.js";
import { config } from "./config/default.js";

// Properties
const props = {
  of: {
    all: () => {}, // pulls all codec data of all elements
    element: (el) => {}, // pulls all codec data of element
    // [codecName]: {
    //   all: () => {},
    //   element: (el) => {}, // pulls codec data of element via codec
    // },
  },
  to: {
    all: () => {}, // pushes data to all codecs on all elements
    element: (el) => {}, // pushes data to all codecs on element
    // [codecName]: {
    //   all: () => {},
    //   element: (el) => {}, // pulls codec data of element via codec
    // },
  },
  at: {
    config: () => {}, // returns at config
    boolean: (bool) => {}, // not sure, should be handled though
    resolve: (string) => {}, // resolves data at path using config
    update: (config) => {}, // updates config with provided object.
  },
  el: {
    all: () => [...document.querySelectorAll(props.op.sels())], // all elements
    element: (el) => {}, // all elements tangentially related by path
    resolve: (string) => {}, // elements relevant to path
    codec: (codec) => [...document.querySelectorAll(`[data-${codec}]`)], // elements relevant to codec
  },
  be: {
    imut: () => {}, // return is without proxy and ref. (good for console.log)
    merge: (object = {}) => {}, // deep merge object to proxy
    set: (string, any) => {}, // compare value at path to provided value
  },
  on: {
    all: () => {}, // returns all listeners
    element: (el) => {}, // returns listeners on element
    update: (obj) => {}, // add listeners, activates them, returns
    getAll: (string) => {}, // returns listeners with provided names
    get: (el, string) => {}, // returns callback
  },
  do: {
    allActions: () => {}, // returns all actions
    has: (string) => {}, // returns true if action exists
    get: (string) => {}, // finds all keys in string and runs their dos.
    merge: (object) => {}, // provides new actions, returns all actions
    used: () => {}, // returns actions used in view.
    unused: () => {}, // returns unused actions in view.
    // [actions]: () => {}, // runs action proxy.
  },
  op: {
    mutsAsEls: (muts) => {
      const uniq = new (WeakSet || Set)();
      muts.forEach((mut) => {
        uniq.add(mut.target);
        mut.addedNodes.forEach(uniq.add);
      });
      return [...uniq];
    },
    mutr: () => {
      const elementsUpdated = flow([
        props.op.mutsAsEls,
        props.op.closures.pull,
      ]);
      const observer = new MutationObserver(elementsUpdated);
      observer.observe(document, props.op.config.watchDom);
    },
    config: {
      watchDom: {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: false,
        attributeOldValue: false,
        characterData: false,
        characterDataOldValue: false,
      },
    },
    closures: {
      push: () => {},
      pull: () => {},
    },
    utils: {},

    init: () => {
      document.addEventListener("DOMContentLoaded", props.op.mutr);
    },
    codecs: {},
    sels: () =>
      Object.keys(props.op.codecs).forEach((codec) => `[data-${codec}]`),
    diff: () => {}, // returns diff between init and now. (can be used to see what reactivity is needed. determine which codecs are likely optional)
    stop: () => {},
    push: () => {},
    pull: () => {},
    maps: () => {},
    sets: () => {},
    keep: () => {},
  },
  go: {
    fn: (fn) => {}, // fn to pass the args of the event to.
    url: (string) => {}, // url to post the args of the event to.
    worker: (worker) => {}, // webworker to post the args of the event to.
  },
  ok: {
    // log tips in dev.
    // if currentScript is in head, tip: adios should be at the end of the page, no need to compete for bandwidth.
    // if window.data was defined, notify the user and tell them where we stored it.
    // show diff of init data and settled data.
  },
};

// main functions
const fns = {
  of: {
    undefined: props.to.all,
    element: props.to.element,
    // [codec]: {
    //   all: () => {}, // pushes data to all elements via codec
    //   element: (el) => {}, // pushes data to element via codec
    // },
  },
  to: {
    undefined: props.to.all,
    element: props.to.element,
    // [codec]: {
    //   all: () => {}, // pushes data to all elements via codec
    //   element: (el) => {}, // pushes data to element via codec
    // },
  },
  at: {
    undefined: props.at.config,
    boolean: props.at.boolean,
    string: props.at.resolve,
    object: props.at.update,
  },
  el: {
    undefined: props.el.all,
    element: props.el.element,
    string: props.el.resolve,
    object: props.el.codec,
  },
  be: {
    undefined: props.be.imut,
    object: props.be.merge,
    string: props.be.set,
  },
  on: {
    undefined: props.on.all,
    element: props.on.element,
    object: props.on.update,
    string: props.on.getAll,
  },
  do: {
    undefined: props.do.allActions,
    string: (str) => (props.do.has(str) ? props.do[str] : props.do.get(str)),
    object: props.do.merge,
    boolean: (b) => (b ? props.do.used() : props.do.unused()),
  },
  go: {
    string: props.go.url,
    function: props.go.fn,
    object: props.go.worker,
  },
};

// CORE API
const API = () => {
  const prior = window?.data;
  console.log(argo(fns.go), props.go);
  window.data = {
    is: props.op.prox({}), // monitors data :: only updates the value IF it has changed
    op: props.op, // holds internal operations
    of: Object.assign(argo(fns.of), props.of),
    to: Object.assign(argo(fns.to), props.to),
    at: Object.assign(argo(fns.at), props.at),
    el: Object.assign(argo(fns.el), props.el),
    be: Object.assign(argo(fns.be), props.be),
    on: Object.assign(argo(fns.on), props.on),
    do: Object.assign(argo(fns.do), props.do),
    go: Object.assign(argo(fns.go), props.go),
  };
  data.op.codecs = {
    text: data.op.utils.prop("textContent"),
    html: data.op.utils.prop("innerHTML"),
    href: data.op.utils.prop("href"),
    src: data.op.utils.prop("src"),
    log: {
      push: (el, path) => console.log("Push:", { el, path }),
      pull: (el, path) => console.log("Pull:", { el, path }),
    },
  };
  data.op.init();
  return prior;
};

const Oath = (promise, transform = ((x) => x), obj = {}) => {
  promise
    .catch((err) => (obj.err = err))
    .then((response) =>
      response
        .json()
        .then((raw) => transform(raw) || raw)
        .then((ok) => (isObject(obj.ok) ? merge(obj.ok, ok) : (obj.ok = ok)))
    )
    .then(console.log);
  return obj;
};

const Adios = () => pusher(puller(config));

export { Adios, Oath };
export default Adios;
