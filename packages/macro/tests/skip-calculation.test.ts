import { pluginTest } from './utils';

pluginTest('skip calculation when a specific condition is met', `
  import { useSSRComputation } from "../lib/index.macro"
  const skip = true;

  // The option is used to skip the calculation when a specific condition is met
  // The option is necessary because React hooks can't be called conditionally
  // The skip option can take any expression that's get evaluated at runtime
  const x = useSSRComputation("./a.ssr-computation", [], { skip, webpackChunkName: "custom-chunk-name" });
`);
