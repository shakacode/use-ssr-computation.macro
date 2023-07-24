import { createMacro } from "babel-plugin-macros";
import { Dependency } from "use-ssr-computation.runtime/src/utils"

import { Options, replaceWithServerAndClientFunctions } from './utils';

export const useSSRComputation: (filename: string, dependencies: Dependency[], options: Options) => any = null as any;

export default createMacro(replaceWithServerAndClientFunctions('useSSRComputation'), {
  configName: "useSSRComputation",
});
