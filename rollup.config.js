import { terser } from "rollup-plugin-terser";
 
export default {
  input: "src/adios.js",
  output: [
    { file: "dist/adios.js", format: "esm" },
    { file: "dist/adios.iife.min.js", format: "iife", name: "Adios", plugins: [terser()] },
    { file: "dist/adios.esm.min.js", format: "esm", plugins: [terser()] },
  ],
};