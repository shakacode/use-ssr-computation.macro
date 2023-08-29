import { useEffect, useMemo, useState } from "react";
import { useSSRCache } from "./SSRCacheProvider";
import { calculateCacheKey, ClientFunction, Dependency, parseDependencies } from "./utils";
import { wrapErrorHandler } from "./errorHandler";

const useSSRComputation_Client: ClientFunction = (importFn, dependencies, options, relativePathToCwd) => {
  const [fn, setFn] = useState<(...dependencies: Dependency[])=>any>();
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
      // Wrapping to an empty function to avoid calling the function immediately.
      // https://medium.com/swlh/how-to-store-a-function-with-the-usestate-hook-in-react-8a88dd4eede1
      setFn(() => module.default);
    });

    return () => {
      isMounted = false;
    };
  }, [isCacheHit, importFn, skip]);

  const result = useMemo(()=> {
    if (!fn || skip) return null;

    return fn(...parsedDependencies);
  }, [fn, cacheKey, skip]);

  useEffect(() => {
    let isMounted = true;

    if (result && typeof result.then === 'function') {
      result.then(asyncResult => {
        if (!isMounted) return;
        cache[cacheKey] = asyncResult;
        forceUpdate((x) => x + 1);
      });
    }
  }, [result, cacheKey]);

  if (skip) {
    return null;
  }

  if (result && typeof result.then !== 'function') {
    cache[cacheKey] = result;
  }
  return cache[cacheKey];
}

export default wrapErrorHandler(useSSRComputation_Client);
