import React, { useMemo } from "react";
import { Dependency, GlobalOptions } from "./utils";

type SSRCacheProviderValue = {
  cache: Record<string, any>;
  globalOptions?: GlobalOptions,
}

const Context = React.createContext<SSRCacheProviderValue>({ cache: {} });

const isSSR = typeof window === 'undefined';

export const SSRCacheProvider = ({ children, cache, globalOptions }: { children: JSX.Element | JSX.Element[]; cache?: SSRCache; globalOptions?: Dependency }) => {
  const cacheValue = (isSSR ? cache : window.__SSR_CACHE__) || {};
  const ssrCacheProviderValue = useMemo(() => ({ cache: cacheValue, globalOptions }), [cacheValue, globalOptions]);

  return <Context.Provider value={ssrCacheProviderValue}>{children}</Context.Provider>;
}

export const useSSRCache = () => {
  return React.useContext(Context);
}
