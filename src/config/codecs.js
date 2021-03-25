import { intersection, set, isString, merge } from "../internals/tiny.js";

/**
 * Codec
 * @typedef {Object} Codec
 * @property {Function} push -
 * @property {Function} pull -
 */

/**
 * This function will take any string of a property,
 * and return a codec for the property.
 *
 * @param {string} name - Name of the property
 * @returns {codec} - the codec object
 */
const prop = (name) => ({
  push: (el, val) => () => (el[name] = val),
  pull: (el) => el[name] || undefined,
});

/**
 *
 * @param {string} name
 */
const dual = (name) => ({
  push: (el, val) => () => [prop, attr].forEach((fn) => fn(name).push(el, val)),
  pull: (el) =>
    [prop, attr].forEach((fn) => fn(name).pull(el)).filter((x) => x)[0] ||
    undefined,
});

/**
 *
 * @param {string} name
 */
const attr = (name) => ({
  push: (el, val) => () => el.setAttribute(name, val),
  pull: (el) => el.getAttribute(name) || undefined,
});

const each = (me) => ({
  push: (el, val = {}) => {
    // console.log(el, val);
    const rootPath = el.dataset.each;
    // the filter function prevents __internal fields from being exposed
    const items = Object.keys(val).filter((s) => !/^__/.exec(s));
    const clone = () => el.content.firstElementChild.cloneNode(true);
    const parent = el.parentElement;
    const siblings = () => [...parent.children].filter((x) => x !== el);

    const [children, closures] = items
      .map((k) => {
        const child = clone();
        // don't forget to include the child itself, it's skipped in the querySelectorAll
        const binds = [child, ...child.querySelectorAll(me.util.selectors())];
        const asClosures = (ele) =>
          Object.entries(ele.dataset)
            .filter(([_codec, itemPath]) =>
              Object.keys(me.codecs).includes(_codec)
            )
            .flatMap(([_codec, itemPath]) => {
              // console.log("Pushing:", _codec, itemPath);
              //  if escaping scope
              const newPath = itemPath.startsWith("~")
                ? // then remove ~ so resolver works
                  itemPath.substring(1)
                : // otherwise, scope the path
                  `${rootPath}.${k}.${itemPath}`;
              ele.dataset[_codec] = newPath;
              // console.log(ele.dataset[_codec]);
              return me.codecs[_codec].push(ele, me.resolver(newPath));
            });

        return [child, binds.flatMap(asClosures)];
      })
      .reduce(
        ([children, acc], [child, cur]) => [
          [...children, child],
          [...acc, ...cur],
        ],
        [[], []]
      );
    // closures were previously included in the push closure
    // why tho? All the logic is happening in a clone,
    // the dom mods shouldn't fire a rerender since it's not in the doc.
    closures.map((fn) => fn());

    return () => {
      siblings().forEach((x) => x.remove());
      parent.append(...children);
    };
  },
  pull: (el) => {
    const prefix = el.dataset.each;
    const result = {};
    const els = me.util.elements(prefix, true);
    const codecs = Object.keys(me.codecs).filter((x) => x !== "each");
    els.forEach((ele) => {
      const hasCodecs = intersection(Object.keys(ele.dataset), codecs);
      hasCodecs.forEach((c) => {
        const pulledVal = me.codecs[c].pull(el);
        const subPath = ele.dataset[c].replace(prefix + ".", "");
        set(result, subPath, pulledVal);
      });
    });
    // console.log("Pulled from each", result);
    return result;
  },
  // parent.querySelectorAll("[data-codec^='path.starts.with']"), pull all into new reduced Object.
});

const inject = (me) => ({
  push: (el, val) => () =>
    // this ensures that all of the other codecs resolved before continuing
    requestAnimationFrame(() => {
      // could and should be improved by building in a cache
      // right now, the val will only be undefined because its cache isn't established
      const url = me.resolver(el.dataset.src);
      if (!url) {
        console.log("No data-src resolved for data-inject to inject", {
          el,
          src: el.dataset.src,
          url,
        });
        return;
      }

      fetch(url).then((response) =>
        response
          .text()
          .catch(console.log)
          .then((nodeStr) => {
            // prevent multiple injections
            if (el?.nextElementSibling?.dataset?.injected) {
              return;
            }
            const injectedEl = document.createElement("div");
            injectedEl.classList.add(...el.classList);
            injectedEl.innerHTML = nodeStr;
            // inserts the fetched text, and makes it the sibling of the element
            el.insertAdjacentElement("afterend", injectedEl);
            injectedEl.dataset.injected = true;
            me.util.hide(el);
          })
      );
    }),
  pull: (el) =>
    el?.nextElementSibling?.dataset?.injected &&
    el?.nextElementSibling?.outerHtml,
});

const codecs = (me = {}) => {
  // assign codec object if non exists
  const given = me.codecs || {};
  const defaults = {
    text: prop("textContent"),
    html: prop("innerHTML"),
    href: prop("href"),
    src: {
      push: (el, val) =>
        // is string, not empty, then set
        () => isString(val) && val && (el.src = val),
      pull: (el) => el.src || undefined,
    },
    replace: prop("outerHTML"),
    each: each(me),
    inject: inject(me),
  };
  // merge defaults, overwrite defaults with given.
  me.codecs = merge(defaults, given);
  return me;
};

export { codecs, prop, dual, attr };
