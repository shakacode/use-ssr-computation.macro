import { useEffect, useMemo, useState } from "react";
import { useSSRCache } from "./SSRCacheProvider";
import { calculateCacheKey, Dependency, isDependency } from "./utils";

export default function useSSRComputation_Client(importFn: () => Promise<{ default: (...dependencies: Dependency[]) => any }>, modulePath: string, dependencies: any[]) {
  const [fn, setFn] = useState<(...dependencies: Dependency[])=>any>();
  const cache = useSSRCache();

  const parsedDependencies = dependencies.map((dependency) => {
    if (isDependency(dependency)) {
      return dependency;
    }
    throw new Error(`useSSRComputation: dependency ${dependency} is not a valid dependency object`);
  }) as Dependency[];

  const cacheKey = calculateCacheKey(modulePath, parsedDependencies);
  const isCacheHit = cache?.[cacheKey];
  useEffect(() => {
    if (isCacheHit) return;

    let isMounted = true;
    importFn().then((module) => {
      if (!isMounted) return;
      // Wrapping to an empty function to avoid calling the function immediately.
      // https://medium.com/swlh/how-to-store-a-function-with-the-usestate-hook-in-react-8a88dd4eede1
      setFn(() => module.default);
    });

    return () => {
      isMounted = false;
    };
  }, [isCacheHit, importFn]);

  const result = useMemo(()=> {
    if (!fn) return null;

    return fn(...parsedDependencies);
  }, [fn]);

  if (isCacheHit) {
    return cache[cacheKey];
  }

  return result;
}
