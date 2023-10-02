import { wrapErrorHandler } from "./errorHandler";
import { calculateCacheKey, Dependency, NoResult, Options, ServerComputationFunction } from "./utils";
import { getSSRCache } from "./ssrCache";

const useSSRComputation_Server = <TResult>(
  computationModule: ServerComputationFunction<TResult>,
  dependencies: Dependency[],
  options: Options,
  relativePathToCwd: string,
): TResult | null => {
  const cache = getSSRCache();
  if (options.skip) return null;

  const result = computationModule.compute(...dependencies);
  if (result === NoResult) {
    throw new Error('The SSR Computation module must return a result on server side');
  }
  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, dependencies);
  cache[cacheKey] = {
    result,
    isSubscription: !!computationModule.subscribe,
  };
  return result;
}

export default wrapErrorHandler(useSSRComputation_Server);
