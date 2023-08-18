import { pluginTest } from './utils';

pluginTest('no usage', `
  import { useSSRComputation } from "../lib/index.macro"
`);

pluginTest('single-import', `
  import { useSSRComputation } from "../lib/index.macro"
  const x = useSSRComputation("./a.ssr-computation", []);
`, `
  Imports the macro and uses it to import a single SSR computation file.
  On server side, it will be statically imported and executed.
  On client side, it will use a dynamic import to lazy load the computation.
  The computation will be loaded on the client side if one of dependencies changes.
`);

pluginTest('multiple-imports', `
  import { useSSRComputation } from "../lib/index.macro"
  const x = useSSRComputation("./a.ssr-computation", [])
  const y = useSSRComputation("./b.ssr-computation", [])
`);

pluginTest('custom-wepback-chunk-name', `
  import { useSSRComputation } from "../lib/index.macro"
  const x = useSSRComputation("./a.ssr-computation", [], { webpackChunkName: "custom-chunk-name" });
`);

pluginTest('used-inside-react-component', `
  import React from "react"
  import { useSSRComputation } from "../lib/index.macro"

  const ReactComponent = () => {
    const x = useSSRComputation("./a.ssr-computation", []);
    // To make sure that the macro generate unqiue names
    const _dynamicImport_ = null;
  }
`);
