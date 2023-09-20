import { useEffect, useMemo, useState } from "react";
import { calculateCacheKey, ClientFunction, Dependency, parseDependencies } from "./utils";
import { wrapErrorHandler } from "./errorHandler";
import { useAsyncResultManager } from "./useAsyncResultManager";
import { getSSRCache } from "./ssrCache";
import { runOnSubscriptionsResumed } from "./subscriptions";

const useSSRComputation_Client: ClientFunction = (importFn, dependencies, options, relativePathToCwd) => {
  const [fn, setFn] = useState<(...dependencies: Dependency[])=>any>();
  const [forceExecution, setForceExecution] = useState(false);
  const cache = getSSRCache();
  const parsedDependencies = parseDependencies(dependencies);
  const skip = !!options.skip;

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  const cachedValue = cache?.[cacheKey]?.result;
  const isSubscription = cache?.[cacheKey]?.isSubscription || false;
  const isCacheHit = !!cachedValue;

  useEffect(() => {
    let isMounted = true;

    if (isSubscription) {
      void runOnSubscriptionsResumed(() => {
        if (isMounted) {
          setForceExecution(true);
        }
      });
    }

    return () => {
      isMounted = false;
    }
  }, [isSubscription]);

  useEffect(() => {
    if ((isCacheHit && !forceExecution) || skip) return;

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
  }, [isCacheHit, importFn, skip, forceExecution]);

  const result = useMemo(()=> {
    if (skip) return null;
    if (!fn) return cachedValue || null;

    return fn(...parsedDependencies);
  }, [fn, cacheKey, skip]);

  const currentResult = useAsyncResultManager(result, cachedValue);

  if (!skip) {
    cache[cacheKey] = {
      result: currentResult,
      isSubscription,
    };
  }
  return currentResult;
}

export default wrapErrorHandler(useSSRComputation_Client);
