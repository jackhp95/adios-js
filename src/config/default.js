import { codecs } from "./codecs.js";
import { resolver } from "./resolver.js";
import { util } from "./../internals/util.js";
import { merge } from "./../internals/tiny.js";

const fixed = {
  is: {},
  config: { root: document },
};
const dynamic = [resolver, util, codecs];
const config = (me) => dynamic.reduce((acc, cur) => cur(acc), merge(fixed, me));

export { config };
