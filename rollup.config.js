import { terser } from "rollup-plugin-terser";
import { babel } from "@rollup/plugin-babel";
import strip from '@rollup/plugin-strip';

export default [
  {
    input: "src/adios.js",
    output: [
      { file: "dist/adios.js", format: "esm" },
      { file: "dist/adios.esm.min.js", format: "esm", plugins: [strip(), terser()] },
    ],
  },
  {
    input: "src/adios.js",
    plugins: [babel({ babelHelpers: "bundled" })],
    output: [
      {
        file: "dist/adios.iife.js",
        format: "iife",
        name: "Adios",
      },
      {
        file: "dist/adios.iife.min.js",
        format: "iife",
        name: "Adios",
        plugins: [strip(), terser()],
      },
    ],
  },
];
