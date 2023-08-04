import { pluginTest } from './utils';

pluginTest('skip calculation when a specific condition is met', `
  import { useSSRComputation } from "../lib/index.macro"
  const skip = true;

  // The option is used to skip the calculation when a specific condition is met
  // The option is necessary because React hooks can't be called conditionally
  // The skip option can take any expression that's get evaluated at runtime
  const x = useSSRComputation("./a.ssr-computation", [], { skip, webpackChunkName: "custom-chunk-name" });
`);

pluginTest('run the calculation on server side only, cache it and don\'t add it to the client bundle', `
  import { useSSRComputation } from "../lib/index.macro";

  // The "serverSideOnly" option is used when we want to add a specific value to the cache without needing it ATM
  // For example, if we want to cache a specific value that will be needed in a component that will not be server-side rendered
  // Because we don't need the value now, we don't need to add it to the client bundle. It will be cahced when it's called on the server
  // The "serverSideOnly" option can only take a boolean value. The value is needed at compile time.
  const x = useSSRComputation("./a.ssr-computation", [], { serverSideOnly: true });
`)
