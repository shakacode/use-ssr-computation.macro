import { useEffect, useRef, useState } from "react";
import { isObservable, isPromise, Observable, Subscription } from "./utils";

export const useAsyncResultManager = <TResult>(
  result: TResult | Promise<TResult> | Observable<TResult>,
  cachedResult: TResult,
): TResult | null => {
  const observerRef = useRef<Subscription | null>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<TResult | null>(null);
  const [promiseResult, setPromiseResult] = useState<TResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (isObservable(result)) {
      observerRef.current = result.subscribe({
        next: (value) => {
          if (!isMounted) return;
          setSubscriptionResult(value);
        },
        error: () => {
          if (!isMounted) return;
          setSubscriptionResult(null);
        },
      });
    } else if (isPromise(result)) {
      result.then((value) => {
        if (!isMounted) return;
        setPromiseResult(value);
      }).catch(() => {
        if (!isMounted) return;
        setPromiseResult(null);
      });
    }

    return () => {
      observerRef.current?.unsubscribe();
      observerRef.current = null;
      isMounted = false;
    }
  }, [result]);

  if (isObservable(result)) {
    return subscriptionResult || result.current || cachedResult;
  }

  if (isPromise(result)) {
    return promiseResult || null;
  }

  return result;
};
