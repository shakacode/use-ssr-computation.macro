const pluginTester = require("babel-plugin-tester").default;
const plugin = require("babel-plugin-macros");

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
      const x = useSSRComputation("./a.ssr-computation");
    `,
    "multiple-imports-server-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation")
      const y = useSSRComputation("./b.ssr-computation")
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
      const x = useSSRComputation("./a.ssr-computation")
    `,
    "multiple-imports-client-side": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation")
      const y = useSSRComputation("./b.ssr-computation")
    `,
    "custom-wepback-chunk-client-side": `
    import { useSSRComputation } from "../lib/index.macro"
    const x = useSSRComputation("./a.ssr-computation", "custom-chunk-name")
  `,
  },
});
