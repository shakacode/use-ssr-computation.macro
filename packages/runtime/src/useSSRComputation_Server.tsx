import { useSSRCache } from "./SSRCacheProvider";
import { InternalUseSSRComputationError, wrapErrorHandler } from "./errorHandler";
import { calculateCacheKey, ServerFunction } from "./utils";

const useSSRComputation_Server: ServerFunction = (fn, dependencies, options, relativePathToCwd) => {
  const { cache, globalOptions } = useSSRCache();
  if (options.skip) return null;

  const result = fn(globalOptions, ...dependencies);
  if (cache) {
    // relativePathToCwd is used to make sure that the cache key is unique for each module
    // and it's not affected by the file that calls it
    const cacheKey = calculateCacheKey(relativePathToCwd, dependencies, globalOptions);
    // check if result is a promise
    if (result && typeof result.then === 'function') {
      throw new InternalUseSSRComputationError(
        'useSSRComputation does not support async functions on the server side',
        result,
      );
    } else {
      cache[cacheKey] = result;
    }
  }

  return result;
}

export default wrapErrorHandler(useSSRComputation_Server);
