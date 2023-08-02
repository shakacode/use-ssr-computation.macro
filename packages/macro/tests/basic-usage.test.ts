const { pluginTester } = require("babel-plugin-tester");
const plugin = require("babel-plugin-macros");

// Adding 'export {}' to make this file a module in TypeScript. This ensures that the top-level 
// declarations like 'const { pluginTester } = require("babel-plugin-tester")' and 
// 'const plugin = require("babel-plugin-macros")' are local to this file. 
// This prevents conflicts with similar declarations in other files.
export {};

pluginTester({
  pluginOptions: {
    useSSRComputation: {
      side: "server",
    },
  },
  plugin,
  snapshot: true,
  babelOptions: {
    filename: __filename,
  },
  tests: {
    "no usage": `import { useSSRComputation } from "../lib/index.macro"`,
    "server-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation", []);
    `,
    "multiple-imports-server-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation", [])
      const y = useSSRComputation("./b.ssr-computation", [])
    `,
  },
});

pluginTester({
  beforeAll: () => {
    process.env['HEEH'] = 'CLIENT_SIDE';
  },
  pluginOptions: {
    useSSRComputation: {
      side: "client",
    },
  },

  plugin,
  restartTitleNumbering: true,
  snapshot: true,
  babelOptions: {
    filename: __filename,
  },
  tests: {
    "client-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation", [])
    `,
    "multiple-imports-client-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation", [])
      const y = useSSRComputation("./b.ssr-computation", [])
    `,
    "custom-wepback-chunk-client-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation", [], { webpackChunkName: "custom-chunk-name" })
    `,
    "client-side inside a react component": `
      import React from "react"
      import { useSSRComputation } from "../lib/index.macro"

      const ReactComponent = () => {
        const x = useSSRComputation("./a.ssr-computation", []);
        // To make sure that the macro generate unqiue names
        const _dynamicImport_ = null;
      }
    `,
  },
});
