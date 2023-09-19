export type SSRCacheItem<TResult> = {
  result: TResult | null;
  isSubscription: boolean;
}
export type SSRCache = Record<string, SSRCacheItem<unknown>>;
let ssrCache: SSRCache = {};

export const setSSRCache = (newCache: SSRCache) => {
  ssrCache = newCache;
}

export const getSSRCache = () => {
  return ssrCache;
}
