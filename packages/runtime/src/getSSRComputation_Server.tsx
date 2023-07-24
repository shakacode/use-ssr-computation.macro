import { calculateCacheKey } from "./utils";

export default function getSSRComputation_Server(fn: (...dependencies: any[]) => any, dependencies: any[], relativePathToCwd: string) {
  const cache = window.__SSR_CACHE__;
  const result = fn(...dependencies)

  if (cache) {
    // relativePathToCwd is used to make sure that the cache key is unique for each module
    // and it's not affected by the file that calls it
    const cacheKey = calculateCacheKey(relativePathToCwd, dependencies);
    cache[cacheKey] = result;
  }

  return result;
}
