import { calculateCacheKey, Dependency, parseDependencies } from "./utils";

export default function getSSRComputation_Client(importFn: () => Promise<{ default: (...dependencies: Dependency[]) => any }>, dependencies: any, relativePathToCwd: string) {
  const cache = window.__SSR_CACHE__;
  const parsedDependencies = parseDependencies(dependencies);

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  const isCacheHit = cache?.[cacheKey];

  if (isCacheHit) {
    return Promise.resolve(cache[cacheKey]);
  }

  return importFn().then((module) => {
    return module.default(...parsedDependencies);
  });
}
