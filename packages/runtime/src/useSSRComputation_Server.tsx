import { useSSRCache } from "./SSRCacheProvider";
import { calculateCacheKey } from "./utils";

export default function useSSRComputation_Server(fn: (...dependencies: any[]) => any, modulePath: string, dependencies: any[]) {
  const cache = useSSRCache();
  const result = fn(...dependencies)

  if (cache) {
    const cacheKey = calculateCacheKey(modulePath, dependencies);
    cache[cacheKey] = result;
  }

  return result;
}
