import defaultConfig, { Init, Config } from "./config"
import { render } from "./dynamic"
import { merge } from "lodash"

const adios = (init: Init) => {
  // combine the given config with the default config
  const config: Config = merge(defaultConfig, init);

  // setRender function on namespace 
  (window as any).adios = render;

  // set properties on namespace 
  Object.entries(config).map(([key, value]) =>
    (window as any).adios[key] = value);

  // render once dom is loaded
  document.addEventListener("DOMContentLoaded", () => {
    render();
  })
};

export default adios;