import { useSSRCache } from "./SSRCacheProvider";

export default function useSSRComputation_Server(fn: () => any, modulePath: string) {
  const cache = useSSRCache();
  const result = fn()

  if (cache) {
    cache[modulePath] = result;
  }

  return result;
}
