import { codecs } from "./codecs.js";
import { resolver } from "./resolver.js";
import { util } from "./../internals/util.js";

const fixed = {
  is: {},
  config: { root: document },
};
const dynamic = [resolver, util, codecs];
const config = dynamic.reduce((acc, cur) => cur(acc), fixed);

export { config };
