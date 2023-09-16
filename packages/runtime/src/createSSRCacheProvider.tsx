import React, { useMemo } from "react";
import { Dependency } from "./utils";

const isSSR = typeof window === 'undefined';

interface SSRCacheProviderProps<GlobalTypeOptions> {
  children: React.ReactElement;
  cache?: SSRCache;
  globalOptions?: GlobalTypeOptions;
}

type SSRCache = Record<string, any>;

interface SSRCacheProviderValue<GlobalTypeOptions> {
  cache?: SSRCache;
  globalOptions?: GlobalTypeOptions;
}

export const createSSRCacheProvider = <GlobalTypeOptions extends Dependency={}>() => {
  const SSRCacheContext = React.createContext<SSRCacheProviderValue<GlobalTypeOptions>>({ });

  const SSRCacheProvider = <GlobalTypeOptions extends Dependency>({ children, cache, globalOptions }: SSRCacheProviderProps<GlobalTypeOptions>) => {
    let cacheValue = (isSSR ? cache : window.__SSR_CACHE__) || {};
    const contextValue = useMemo(() => ({
      cache: cacheValue,
      globalOptions
    }), [cacheValue, globalOptions]);

    return <SSRCacheContext.Provider value={contextValue}>{children}</SSRCacheContext.Provider>;
  };

  const useSSRCache = () => {
    return React.useContext(SSRCacheContext);
  }

  return {
    SSRCacheProvider,
    useSSRCache,
  }
};
