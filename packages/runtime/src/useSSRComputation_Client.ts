import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCacheKey,
  Dependency, isObservable,
  isPromise, Observable,
  Options,
  parseDependencies,
  SSRComputationFunction, Subscription,
} from "./utils";
import { wrapErrorHandler } from "./errorHandler";
import { getSSRCache } from "./ssrCache";
import { runOnSubscriptionsResumed } from "./subscriptions";
import { ClientComputationFunction } from "./utils";

const useSSRComputation_Client = <TResult>(
  importFn: ClientComputationFunction<TResult>,
  dependencies: Dependency[],
  options: Options,
  relativePathToCwd: string
): TResult | null => {
  const [, forceUpdate] = useState(0);
  const cache = getSSRCache();
  const parsedDependencies = parseDependencies(dependencies);
  const skip = !!options.skip;
  const subscriptionRef = useRef<Subscription>()
  const fnInfo = useRef<{ fn: SSRComputationFunction<TResult>, importFn: ClientComputationFunction<TResult> }>()
  const isMountedRef = useRef(true);

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  const cachedResult = cache[cacheKey]?.result as TResult | undefined;
  const isSubscription = cache[cacheKey]?.isSubscription;
  const isCacheHit = cacheKey in cache;

  const unsubscribe = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = undefined;
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    }
  }, []);

  const handleResult = useCallback((returnedResult: TResult | Promise<TResult> | Observable<TResult>, isMounted: () => boolean) => {
    unsubscribe();
    const updateResult = (newResult: TResult) => {
      if (!isMounted()) return;
      if (cacheKey in cache && cache[cacheKey]?.result === newResult) return;
      cache[cacheKey] = {
        result: newResult,
        isSubscription: cache[cacheKey]?.isSubscription || false,
      };
      forceUpdate(prevState => prevState + 1);
    }

    if (isPromise(returnedResult)) {
      returnedResult.then(updateResult);
    } else if (isObservable(returnedResult)) {
      if (!isMounted()) return;
      subscriptionRef.current = returnedResult.subscribe({ next: updateResult });
    } else {
      updateResult(returnedResult);
    }
  }, [forceUpdate, cacheKey])

  useEffect(() => {
    if (isCacheHit || fnInfo.current?.importFn === importFn) return;
    let isMounted = true;

    importFn().then(module => {
      if (!isMounted) return;
      fnInfo.current = {
        importFn,
        fn: module.default,
      };
      handleResult(module.default(...dependencies), () => isMounted);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [cacheKey, importFn]);

  useEffect(() => {
    if (!isSubscription) return;

    let isMounted = true;

    void runOnSubscriptionsResumed(() => {
      if (!isMounted) return;

      importFn().then(module => {
        if (!isMounted) return;
        fnInfo.current = {
          importFn,
          fn: module.default,
        };
        return module.default;
      }).then(fn => {
        if (!isMounted || !fn) return;
        handleResult(fn(...dependencies), () => isMounted);
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [importFn, cacheKey]);

  const result = useMemo<null | TResult>((): TResult | null => {
    if (skip) return null;
    const fn = fnInfo.current?.fn;
    if (importFn !== fnInfo.current?.importFn || !fn || isCacheHit) return cachedResult || null;

    const returnedResult = fn(...dependencies);
    handleResult(returnedResult, () => isMountedRef.current);

    if (isPromise(returnedResult)) {
      return null;
    } else if (isObservable(returnedResult)) {
      return returnedResult.current;
    } else {
      return returnedResult;
    }
  }, [skip, cacheKey, importFn, cachedResult, isCacheHit]);

  return result;
}

export default wrapErrorHandler(useSSRComputation_Client);
