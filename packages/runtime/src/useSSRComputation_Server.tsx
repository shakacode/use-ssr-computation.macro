import { useSSRCache } from "./SSRCacheProvider";
import { calculateCacheKey } from "./utils";

export default function useSSRComputation_Server(fn: (...dependencies: any[]) => any, dependencies: any[], relativePathToCwd: string) {
  const cache = useSSRCache();
  const result = fn(...dependencies)

  if (cache) {
    // relativePathToCwd is used to make sure that the cache key is unique for each module
    // and it's not affected by the file that calls it
    const cacheKey = calculateCacheKey(relativePathToCwd, dependencies);
    // check if result is a promise
    if (result && typeof result.then === 'function') {
      cache[cacheKey] = result.then(asyncResult => cache[cacheKey] = asyncResult);
    } else {
      cache[cacheKey] = result;
    }
  }

  return result;
}
