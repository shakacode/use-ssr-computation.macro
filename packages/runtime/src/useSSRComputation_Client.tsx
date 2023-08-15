import { useEffect, useState } from "react";
import { useSSRCache } from "./SSRCacheProvider";
import { calculateCacheKey, Dependency, Options, parseDependencies } from "./utils";

export default function useSSRComputation_Client(importFn: () => Promise<{ default: (...dependencies: Dependency[]) => any }>, dependencies: any[], options: Options, relativePathToCwd: string) {
  const [, forceUpdate] = useState(0);
  const cache = useSSRCache();
  const parsedDependencies = parseDependencies(dependencies);
  const skip = !!options.skip;

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  const isCacheHit = cache?.[cacheKey];
  useEffect(() => {
    if (isCacheHit || skip) return;

    let isMounted = true;
    importFn().then((module) => {
      if (!isMounted) return;
      const result = module.default();
      if (result && typeof result.then === 'function') {
        result.then(asyncResult => {
          if (!isMounted) return;
          cache[cacheKey] = asyncResult;
          forceUpdate((x) => x + 1);
        });
      } else {
        cache[cacheKey] = result;
        forceUpdate((x) => x + 1);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isCacheHit, importFn, skip, cacheKey]);

  if (isCacheHit && !skip) {
    return cache[cacheKey];
  }

  return null;
}
