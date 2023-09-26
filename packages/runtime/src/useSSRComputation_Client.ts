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

const NoComputationResult = Symbol('NoComputationResult');

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

  const handleSubscription = useCallback(({ useCurrentResult } : { useCurrentResult: boolean }) => {
    if (isDisposed()) return;

    const updateResult = (newResult: TResult) => {
      if (isDisposed()) return;
      if (currentResultRef.current === newResult) return;
      cache[cacheKey] = {
        result: newResult,
        isSubscription: cache[cacheKey]?.isSubscription || !!moduleRef.current?.subscribe,
      };
      if (currentResultRef.current !== newResult) {
        forceUpdate(prevState => prevState + 1);
      }
    }

    if (useCurrentResult) {
      const fn = moduleRef.current?.compute;
      if (!fn) return;
      updateResult(fn(...parsedDependencies));
    }
    subscriptionRef.current = moduleRef.current?.subscribe?.(updateResult, ...parsedDependencies);
  }, [forceUpdate, isDisposed, cacheKey]);

  useEffect(() => {
    if (moduleRef.current) {
      handleSubscription({ useCurrentResult: false });
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
      handleSubscription({ useCurrentResult: true });
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
    if (skip) return NoComputationResult;
    const fn = moduleRef.current?.compute;
    if (!fn) return NoComputationResult;

    return fn(...parsedDependencies);
  }, [skip, cacheKey]);

  const resultFromCache = useMemo(() => {
    if (skip) return null;
    return cachedResult ?? null;
  }, [skip, cachedResult]);

  const result = useMemo(() => {
    if (skip) return null;
    if (resultFromComputation === NoComputationResult) return resultFromCache;
    return resultFromComputation;
  }, [resultFromComputation, resultFromCache]);

  currentResultRef.current = result;
  return result;
}

export default wrapErrorHandler(useSSRComputation_Client);
