const pluginTester = require("babel-plugin-tester").default;
const plugin = require("babel-plugin-macros");

pluginTester({
  pluginOptions: {
    SSRComputation: {
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
  pluginOptions: {
    SSRComputation: {
      side: "server",
    },
  },
  plugin,
  snapshot: true,
  babelOptions: {
    filename: __filename,
  },
  tests: {
    "no usage": `import { getSSRComputation } from "../lib/get-ssr-computation.macro"`,
    "server-side": `
      import { getSSRComputation } from "../lib/get-ssr-computation.macro"
      const x = getSSRComputation("./a.ssr-computation", []);
    `,
    "multiple-imports-server-side": `
      import { getSSRComputation } from "../lib/get-ssr-computation.macro"
      const x = getSSRComputation("./a.ssr-computation", [])
      const y = getSSRComputation("./b.ssr-computation", [])
    `,
  },
});

pluginTester({
  beforeAll: () => {
    process.env['HEEH'] = 'CLIENT_SIDE';
  },
  pluginOptions: {
    SSRComputation: {
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
  },
});

pluginTester({
  beforeAll: () => {
    process.env['HEEH'] = 'CLIENT_SIDE';
  },
  pluginOptions: {
    SSRComputation: {
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
      import { getSSRComputation } from "../lib/get-ssr-computation.macro"
      const x = getSSRComputation("./a.ssr-computation", [])
    `,
    "multiple-imports-client-side": `
      import { getSSRComputation } from "../lib/get-ssr-computation.macro"
      const x = getSSRComputation("./a.ssr-computation", [])
      const y = getSSRComputation("./b.ssr-computation", [])
    `,
    "custom-wepback-chunk-client-side": `
    import { getSSRComputation } from "../lib/get-ssr-computation.macro"
    const x = getSSRComputation("./a.ssr-computation", [], { webpackChunkName: "custom-chunk-name" })
  `,
  },
});
