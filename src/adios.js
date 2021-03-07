import { withDefault } from "./internals/tiny.js";
import { pusher } from "./core/pusher.js";
import { puller } from "./core/puller.js";
import { config } from "./config/default.js";

const Oath = (dest, promise, transform = (x) => x) => {
  dest = dest || {}; 
  
  promise
    .catch((err) => (dest.err = err))
    .then((response) =>
      response
        .json()
        .catch((err) => (dest.err = err))
        .then((raw) => withDefault(transform(raw), raw))
        .then((ok) => dest.ok = ok)
    )
    .then(console.log);
    return dest;
};

const Adios = () => pusher(puller(config));

export { Adios, Oath };
export default Adios;
