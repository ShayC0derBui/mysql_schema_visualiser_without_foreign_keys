// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  // Use your main entry point file that imports the other modules.
  input: "static/js/main.js",
  output: {
    file: "index.js", // bundled output file
    format: "iife", // Immediately Invoked Function Expression, works directly in browsers.
    name: "MyApp", // Global variable name for your bundle.
    sourcemap: false,
  },
  plugins: [
    resolve(),
    commonjs(),
    terser(), // Minify the bundle.
  ],
};
