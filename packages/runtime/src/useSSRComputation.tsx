import { useEffect, useMemo, useState } from "react";
import { useSSRCache } from "./SSRCacheProvider";

export function useSSRComputation_Client(modulePath: string) {
  console.log("Hello from client");

  const [fn, setFn] = useState<()=>any>();
  const cache = useSSRCache();

  const isCacheHit = cache?.[modulePath];
  useEffect(() => {
    if (isCacheHit) return;

    let isMounted = true;
    import(modulePath).then((module) => {
      if (!isMounted) return;
      setFn(module.default);
    });

    return () => {
      isMounted = false;
    };
  }, [isCacheHit, modulePath]);

  const result = useMemo(()=> {
    if (!fn) return null;
    return fn();
  }, [fn]);

  if (isCacheHit) {
    return cache[modulePath];
  }

  return result;
}

export function useSSRComputation_Server(fn: () => any, modulePath: string) {
  console.log("Hello from server");
  const cache = useSSRCache();
  const result = fn()

  if (cache) {
    cache[modulePath] = result;
  }

  return result;
}
