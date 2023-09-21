import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCacheKey,
  ClientHook,
  Dependency,
  isPromise,
  Options,
  parseDependencies,
  SSRComputationFunction,
} from "./utils";
import { wrapErrorHandler } from "./errorHandler";
import { useAsyncResultManager } from "./useAsyncResultManager";
import { getSSRCache } from "./ssrCache";
import { runOnSubscriptionsResumed } from "./subscriptions";
import { ClientComputationFunction } from "./utils";

const useSSRComputation_Client = <TResult>(
  importFn: ClientComputationFunction<TResult>,
  dependencies: Dependency[],
  options: Options,
  relativePathToCwd: string
): TResult | null => {
  const [fn, setFn] = useState<(...dependencies: Dependency[])=>any>();
  const fnInfo = useRef<{ fn: SSRComputationFunction<TResult>, importFn: ClientComputationFunction<TResult> } | null>(null);
  const cache = getSSRCache();
  const parsedDependencies = parseDependencies(dependencies);
  const skip = !!options.skip;

  const [promiseResult, setPromiseResult] = useState<TResult | null>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<TResult | null>(null);

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  const cachedValue = cache?.[cacheKey]?.result;
  const isSubscription = cache?.[cacheKey]?.isSubscription || false;
  const isCacheHit = !!cachedValue;

  useEffect(() => {
    let isMounted = true;

    if (isSubscription) {
      void runOnSubscriptionsResumed(async () => {
        if (!isMounted) return;
        const subscribe = (await importFn()).subscribe;
      });
    }

    return () => {
      isMounted = false;
    }
  }, [isSubscription]);

  useEffect(() => {
    if ((isCacheHit && !isSubscription) || skip) return;

    const getResult = (fn: SSRComputationFunction<TResult>) => {
      const result = fn(...dependencies);
      if (isPromise(result)) {
        result.then(promiseResult => {
          if (!isMounted) return;
          setPromiseResult(promiseResult);
        })
      }
    }

    let isMounted = true;
    if (fnInfo.current?.importFn !== importFn) {
      importFn().then((module) => {
        if (!isMounted) return;
        fnInfo.current = {
          importFn,
          fn: module.default,
        };
      });
    }
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
