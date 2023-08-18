const { pluginTester } = require("babel-plugin-tester");
const plugin = require("babel-plugin-macros");

export function pluginTest(testName: string, testBody: any, testDescription: string | null = null) {
  ['server', 'client'].forEach((side) => {
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
        [`${side}-${testDescription || testName}`]: testBody,
      },
    }));
  });
}
