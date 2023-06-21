import { useEffect, useMemo, useState } from "react";
import { useSSRCache } from "./SSRCacheProvider";

export default function useSSRComputation_Client(importFn: () => Promise<{ default: () => any }>, modulePath: string) {
  console.log("Hello from client");

  const [fn, setFn] = useState<()=>any>();
  const cache = useSSRCache();

  const isCacheHit = cache?.[modulePath];
  useEffect(() => {
    if (isCacheHit) return;

    let isMounted = true;
    importFn().then((module) => {
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
