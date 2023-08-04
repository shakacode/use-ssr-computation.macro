const { pluginTester } = require("babel-plugin-tester");
const plugin = require("babel-plugin-macros");

export function pluginTest(testName, testBody) {
  ['server', 'client'].forEach((side) => {
    console.log('pluginTest', { testName, side });
    console.log(pluginTester({
      pluginOptions: {
        useSSRComputation: { side },
      },
      plugin,
      snapshot: true,
      restartTitleNumbering: true,
      babelOptions: {
        filename: `${testName}.test.ts`,
      },
      tests: {
        [`${side}-${testName}`]: testBody,
      },
    }));
    console.log('pluginTest', { testName, side, done: true })
  });
}
