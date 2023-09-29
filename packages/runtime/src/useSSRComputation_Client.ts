import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCacheKey,
  ClientComputationFunction,
  Dependency,
  Options,
  parseDependencies,
  SSRComputationModule,
  Subscription,
} from "./utils";
import { wrapErrorHandler } from "./errorHandler";
import { getSSRCache } from "./ssrCache";
import { runOnSubscriptionsResumed } from "./subscriptions";

const NoResult = Symbol('NoResult');

type ClientState<TResult> = {
  module?: SSRComputationModule<TResult>,
  currentResult: TResult | null,
  importFn: ClientComputationFunction<TResult>,
  currentExecutor?: ComputationExecutor<TResult>,
};

class ComputationExecutor<TResult> {
  isDisposed = false;
  subscription: Subscription | undefined;

  constructor(
    private readonly dependencies: Dependency[],
    private readonly updateResult: (TResult) => void,
    private readonly state: ClientState<TResult>,
  ) {}

  handleSubscriptionIfModuleLoaded = ({ recomputeTheResult }: { recomputeTheResult: boolean }) => {
    if (this.isDisposed || !this.state.module) return;

    const updateResult = (newResult: TResult) => {
      if (this.isDisposed || this.state.currentResult === newResult) return;
      this.updateResult(newResult);
    }

    if (recomputeTheResult) {
      const fn = this.state.module?.compute;
      if (fn) {
        updateResult(fn(...this.dependencies));
      }
    }
    const getCurrentResult = () => this.state.currentResult!;
    this.subscription = this.state.module?.subscribe?.(getCurrentResult, updateResult, ...this.dependencies);
  }

  getResultIfModuleLoaded = () => {
    const fn = this.state.module?.compute;
    return fn ? fn(...this.dependencies) : NoResult;
  }

  loadAndRun = () => {
    if (this.isDisposed) return;
    this.state.importFn().then(module => {
      if (this.isDisposed) return;
      if (!module.compute) throw new Error('The SSR Computation module must have a compute function');
      this.state.module = module;
      this.handleSubscriptionIfModuleLoaded({ recomputeTheResult: true });
    });
  }

  dispose = () => {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }
}

const useSSRComputation_Client = <TResult>(
  importFn: ClientComputationFunction<TResult>,
  dependencies: Dependency[],
  options: Options,
  relativePathToCwd: string
): TResult | null => {
  const [, forceUpdate] = useState(0);
  const clientState = useRef<ClientState<TResult>>({
    importFn,
    currentResult: null,
  });

  const cache = getSSRCache();
  const parsedDependencies = parseDependencies(dependencies);
  const skip = !!options.skip;
  // relativePathToCwd is used to make sure that the cache key is unique for each module
  // and it's not affected by the file that calls it
  const cacheKey = calculateCacheKey(relativePathToCwd, parsedDependencies);

  const updateResult = useCallback((newResult: TResult, rerender: boolean) => {
    cache[cacheKey] = {
      result: newResult,
      isSubscription: cache[cacheKey]?.isSubscription || !!clientState.current?.module?.subscribe,
    }
    clientState.current.currentResult = newResult;
    if (rerender) {
      forceUpdate(prevState => prevState + 1);
    }
  }, [cacheKey]);

  const executor = useMemo(() => {
    clientState.current.currentExecutor?.dispose();
    clientState.current.currentExecutor = undefined;

    if (skip) return null;
    const updateResultAndRerender = (newResult: TResult) => updateResult(newResult, true);
    clientState.current.currentExecutor = new ComputationExecutor(parsedDependencies, updateResultAndRerender, clientState.current);

    const computedResult = clientState.current.currentExecutor.getResultIfModuleLoaded();
    if (computedResult !== NoResult) {
      updateResult(computedResult, false);
    }
    return clientState.current.currentExecutor;
  }, [skip, cacheKey, updateResult]);

  useEffect(() => {
    // If the module is loaded, the current is result is calculated at the same render.
    // And here we need to subscribe to the module if it has a subscribe function.
    executor?.handleSubscriptionIfModuleLoaded({ recomputeTheResult: false });

    return () => {
      executor?.dispose();
    }
  }, [executor]);

  const isCacheHit = cacheKey in cache;
  const cachedResult = isCacheHit ? cache[cacheKey]?.result as TResult : NoResult;
  const isStoredAsSubscriptionInCache = cache[cacheKey]?.isSubscription;

  useEffect(() => {
    // It loads the module and run it if there is a cache miss.
    // If the module supports subscriptions, it will be loaded only when subscriptions are resumed.
    if (clientState.current?.module || !executor) return;
    if (!isCacheHit) {
      executor.loadAndRun();
    } else if (isStoredAsSubscriptionInCache) {
      void runOnSubscriptionsResumed(executor.loadAndRun);
    }
  }, [isCacheHit, isStoredAsSubscriptionInCache, executor]);

  const result = cachedResult === NoResult ? null : cachedResult;
  clientState.current.currentResult = result;
  return result;
}

export default wrapErrorHandler(useSSRComputation_Client);
