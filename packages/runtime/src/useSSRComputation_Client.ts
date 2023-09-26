import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCacheKey,
  Dependency,
  Options,
  parseDependencies,
  SSRComputationModule, Subscription,
} from "./utils";
import { wrapErrorHandler } from "./errorHandler";
import { getSSRCache } from "./ssrCache";
import { runOnSubscriptionsResumed } from "./subscriptions";
import { ClientComputationFunction } from "./utils";

const NoResult = Symbol('NoResult');

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
  const moduleRef = useRef<SSRComputationModule<TResult>>()
  const isMountedRef = useRef(true);
  const currentCacheKeyRef = useRef('');
  const currentResultRef = useRef<TResult | null>(null);

  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);
  currentCacheKeyRef.current = cacheKey;
  const cachedResult = cache[cacheKey]?.result as TResult | undefined;
  const isStoredAsSubscriptionInCache = cache[cacheKey]?.isSubscription;
  const isCacheHit = cacheKey in cache;

  const isDisposed = useCallback(() => {
    return skip || cacheKey !== currentCacheKeyRef.current || !isMountedRef.current;
  }, [skip, cacheKey]);

  const updateCache = useCallback((newResult: TResult) => {
    cache[cacheKey] = {
      result: newResult,
      isSubscription: cache[cacheKey]?.isSubscription || !!moduleRef.current?.subscribe,
    };
  }, [cacheKey]);

  const handleSubscription = useCallback(({ recomputeTheResult } : { recomputeTheResult: boolean }) => {
    if (isDisposed()) return;

    const updateResult = (newResult: TResult) => {
      if (isDisposed() || currentResultRef.current === newResult) return;
      updateCache(newResult);
      currentResultRef.current = newResult;
      forceUpdate(prevState => prevState + 1);
    }

    if (recomputeTheResult) {
      const fn = moduleRef.current?.compute;
      if (fn) {
        updateResult(fn(...parsedDependencies));
      }
    }
    const getCurrentResult = () => currentResultRef.current!;
    subscriptionRef.current = moduleRef.current?.subscribe?.(getCurrentResult, updateResult, ...parsedDependencies);
  }, [forceUpdate, isDisposed, cacheKey, updateCache]);

  useEffect(() => {
    if (moduleRef.current) {
      handleSubscription({ recomputeTheResult: false });
    }

    return () => {
      isMountedRef.current = false;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = undefined;
    }
  }, [cacheKey, handleSubscription]);

  const loadAndRun = useCallback(() => {
    if (!isMountedRef.current || skip) return;
    importFn().then(module => {
      if (!isMountedRef.current) return;
      moduleRef.current = module;
      handleSubscription({ recomputeTheResult: true });
    });
  }, [importFn, handleSubscription, cacheKey]);

  useEffect(() => {
    if (isCacheHit || moduleRef.current || skip) return;
    loadAndRun();
  }, [cacheKey, loadAndRun, skip]);

  useEffect(() => {
    if (!isStoredAsSubscriptionInCache || moduleRef.current || skip) return;
    void runOnSubscriptionsResumed(loadAndRun);
  }, [cacheKey, loadAndRun, skip]);

  const resultFromComputation = useMemo(() => {
    if (skip) return NoResult;
    const fn = moduleRef.current?.compute;
    if (!fn) return NoResult;

    return fn(...parsedDependencies);
  }, [skip, cacheKey]);

  const resultFromCache = useMemo(() => {
    if (skip) return NoResult;
    return cachedResult ?? NoResult;
  }, [skip, cachedResult]);

  const result = useMemo(() => {
    if (skip) return NoResult;
    if (resultFromComputation === NoResult) return resultFromCache;
    return resultFromComputation;
  }, [resultFromComputation, resultFromCache, skip]);

  if (result === NoResult) return null;
  currentResultRef.current = result;
  updateCache(result);
  return result;
}

export default wrapErrorHandler(useSSRComputation_Client);
