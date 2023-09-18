import { Dependency, GlobalOptions } from "./utils";
import { useSSRCache } from "./SSRCacheProvider";
import { useEffect, useMemo, useRef, useState } from "react";

export type Subscription = {
  unsubscribe: () => void;
}

export type Observable<T> = {
  subscribe: ({
    next,
    error,
  }: {
    next: (value: T) => void;
    error?: (error: any) => void;
  }) => Subscription;
}

const isObservable = <T>(obj: any): obj is Observable<T> => {
  return obj && typeof obj.subscribe === 'function';
}

export const useLiveResult = <ResultT>(
  dependencies: Dependency[],
  fn: ((globalOptions: GlobalOptions, ...dependencies: Dependency[])=>any) | undefined,
  { cachedValue, cacheKey, skip }: { cachedValue: ResultT | null; cacheKey: string; skip: boolean },
) => {
  const { globalOptions } = useSSRCache();
  const observerRef = useRef<Subscription | null>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<ResultT | null>(null);

  const result = useMemo(() => {
    observerRef.current?.unsubscribe();
    observerRef.current = null;
    if (skip) {
      return null;
    }

    if (!fn) {
      return cachedValue || null;
    }

    return fn(globalOptions, ...dependencies);
    // The function should be recalled only when cache key is  changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, cacheKey]);

  const isSubscribable = isObservable<ResultT>(result);
  useEffect(() => {
    // check if it's an observable query
    if (isSubscribable) {
      observerRef.current = result.subscribe({
        next: (nextResult) => {
          setSubscriptionResult(nextResult);
        },
      });
    }

    return () => {
      observerRef.current?.unsubscribe();
      observerRef.current = null;
    };
  }, [isSubscribable, result]);

  if (isSubscribable) {
    return subscriptionResult || cachedValue;
  }

  return result;
};
