import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import pkg from "./package.json";
import typescript from "rollup-plugin-typescript2";

export default [
  // browser-friendly UMD build
  {
    input: "index.ts",
    output: {
      name: "d3",
      file: pkg.browser,
      format: "umd",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: "./dist/types",
            allowJs: true
          }
        }
      }),
      babel({
        exclude: ["node_modules/**"],
      }),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  {
    input: "index.ts",
    external: [], // list dependencies here if needed
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: "./dist/types",
            allowJs: true
          }
        }
      }),
      babel({
        exclude: ["node_modules/**"],
      }),
    ],
  },
];
