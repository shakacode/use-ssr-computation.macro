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
  const fnRef = useRef<SSRComputationFunction<TResult>>()
  const isMountedRef = useRef(true);
  const currentCacheKeyRef = useRef('');
  const currentResultRef = useRef<TResult | null>(null);

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  currentCacheKeyRef.current = cacheKey;
  const cachedResult = cache[cacheKey]?.result as TResult | undefined;
  const isSubscription = cache[cacheKey]?.isSubscription;
  const isCacheHit = cacheKey in cache;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = undefined;
    }
  }, [cacheKey]);

  const isDisposed = useCallback(() => {
    return cacheKey !== currentCacheKeyRef.current || !isMountedRef.current;
  }, [cacheKey]);

  const handleResult = useCallback((returnedResult: TResult | Promise<TResult> | Observable<TResult>) => {
    if (isDisposed()) return;

    const updateResult = (newResult: TResult) => {
      if (isDisposed()) return;
      if (currentResultRef.current === newResult) return;
      cache[cacheKey] = {
        result: newResult,
        isSubscription: cache[cacheKey]?.isSubscription || isObservable(returnedResult),
      };
      forceUpdate(prevState => prevState + 1);
    }

    if (isPromise(returnedResult)) {
      returnedResult.then(updateResult);
    } else if (isObservable(returnedResult)) {
      subscriptionRef.current = returnedResult.subscribe({ next: updateResult });
    } else {
      updateResult(returnedResult);
    }
  }, [forceUpdate, isDisposed, cacheKey]);

  const loadAndRun = useCallback(() => {
    if (!isMountedRef.current) return;
    importFn().then(module => {
      if (!isMountedRef.current) return;
      fnRef.current = module.default;
      handleResult(module.default(...parsedDependencies));
    });
  }, [importFn, handleResult, cacheKey]);

  useEffect(() => {
    if (isCacheHit || fnRef.current) return;
    loadAndRun();
  }, [cacheKey, loadAndRun]);

  useEffect(() => {
    if (!isSubscription || fnRef.current) return;
    void runOnSubscriptionsResumed(loadAndRun);
  }, [cacheKey, loadAndRun]);

  const resultFromComputation = useMemo(() => {
    if (skip) return null;
    const fn = fnRef.current;
    if (!fn) return null;

    return fn(...parsedDependencies);
  }, [skip, cacheKey]);

  useEffect(() => {
    if (!isPromise(resultFromComputation) && !isObservable(resultFromComputation)) return;
    handleResult(resultFromComputation);
  }, [handleResult, resultFromComputation]);

  const resultFromCache = useMemo(() => {
    if (skip) return null;
    return cachedResult || null;
  }, [skip, cachedResult]);

  const result = useMemo(() => {
    if (!resultFromComputation || isPromise(resultFromComputation)) return resultFromCache;
    if (isObservable(resultFromComputation)) return resultFromComputation.current || resultFromCache;
    return resultFromComputation;
  }, [resultFromComputation, resultFromCache]);

  currentResultRef.current = result;
  return result;
}

export default wrapErrorHandler(useSSRComputation_Client);
