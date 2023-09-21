import { InternalUseSSRComputationError, wrapErrorHandler } from "./errorHandler";
import {
  calculateCacheKey,
  Dependency,
  isObservable,
  isPromise,
  Options,
  ServerComputationFunction,
} from "./utils";
import { getSSRCache } from "./ssrCache";

const useSSRComputation_Server = <TResult>(
  fn: ServerComputationFunction<TResult>,
  dependencies: Dependency[],
  options: Options,
  relativePathToCwd: string,
): TResult | null => {
  const cache = getSSRCache();
  if (options.skip) return null;

  const result = fn(...dependencies);
  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, dependencies);
  // check if result is a promise
  if (isPromise(result)) {
    throw new InternalUseSSRComputationError(
      'useSSRComputation does not support async functions on the server side',
      result,
    );
  } else if (isObservable(result)) {
    cache[cacheKey] = {
      result: result.current,
      isSubscription: true,
    }
    return result.current;
  } else {
    cache[cacheKey] = {
      result,
      isSubscription: false,
    };
  }
  return result;
}

export default wrapErrorHandler(useSSRComputation_Server);
