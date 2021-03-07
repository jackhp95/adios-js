import { withDefault, identity, isObject } from "./internals/tiny.js";
import { pusher, watch } from "./core/pusher.js";
import { puller } from "./core/puller.js";
import { config } from "./config/default.js";

const Oath = (transform = identity) => ({
  oath: function (promise) {
    console.log("this", this);
    promise
      .catch((err) => (this.err = err))
      .then((response) =>
        response
          .json()
          .catch((err) => (this.err = err))
          .then((raw) => withDefault(transform(raw, this.ok), raw))
          .then((ok) => (this.ok = ok))
      )
      .then(console.log);
  },
});

const Adios = () => pusher(puller(config));

export { Adios, Oath };
export default Adios;
