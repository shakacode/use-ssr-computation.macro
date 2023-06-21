import { useSSRCache } from "./SSRCacheProvider";

export default function useSSRComputation_Server(fn: () => any, modulePath: string) {
  console.log("Hello from server");
  const cache = useSSRCache();
  const result = fn()

  if (cache) {
    cache[modulePath] = result;
  }

  return result;
}
