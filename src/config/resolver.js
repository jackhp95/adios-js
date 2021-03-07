import { get, set, isString } from "../internals/tiny.js";

const resolver = (me) => {
  me.resolver = (...args) => {
    const [path, value] = args;
    const switcher = {
      0: () => console.error("resolver has no args."),
      1: () => {
        // console.log(me?.be?.(), path);
        return get(me.is, path);
      },
      2: () => set(me.is, path, value),
      3: () => console.error("resolver has 3 or more args:", args),
    };
    return switcher[Math.min(args.length, 3)]();
  };
  return me;
};

export { resolver };
