const pluginTester = require("babel-plugin-tester").default;
const plugin = require("babel-plugin-macros");

pluginTester({
  pluginOptions: {
    useSSRComputation: {
      side: "client",
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
    "multiple-imports": `
      import { useSSRComputation } from "../lib/index.macro"
      const x = useSSRComputation("./a.ssr-computation")
      const y = useSSRComputation("./a.ssr-computation")
    `,
  },
});

pluginTester({
  beforeAll: () => {
    process.env['HEEH'] = 'CLIENT_SIDE';
  },
  pluginOptions: {
    useSSRComputation: {
      side: "server",
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
  },
});
