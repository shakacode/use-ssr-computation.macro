const { pluginTester } = require("babel-plugin-tester");
const plugin = require("babel-plugin-macros");

export {};

['server', 'client'].forEach((side) => {
  pluginTester({
    pluginOptions: {
      useSSRComputation: { side },
    },
    plugin,
    snapshot: true,
    restartTitleNumbering: true,
    babelOptions: {
      filename: __filename,
    },
    tests: {
      [`${side}-side with skip option`]: `
        import { useSSRComputation } from "../lib/index.macro"
        const skip = true;
        const x = useSSRComputation("./a.ssr-computation", [], { skip, webpackChunkName: "custom-chunk-name" })
      `,
      [`${side}-side with serverSideOnly`]: `
        import { useSSRComputation } from "../lib/index.macro"
        const skip = true;
        const x = useSSRComputation("./a.ssr-computation", [], { serverSideOnly: true })
      `,
    },
  });
});
