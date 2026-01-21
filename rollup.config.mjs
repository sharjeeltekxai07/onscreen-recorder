import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { dts } from "rollup-plugin-dts";
import { readFileSync } from "fs";
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

const external = ["react", "react-dom"];

export default [
  // Main build
  {
    input: "lib/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
        exports: "named",
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.lib.json",
        declaration: false,
      }),
      postcss({
        extract: "index.css",
        minimize: true,
      }),
    ],
    external,
  },
  // Type definitions
  {
    input: "lib/index.ts",
    output: {
      file: packageJson.types,
      format: "esm",
    },
    plugins: [dts()],
    external: [/\.css$/],
  },
];
