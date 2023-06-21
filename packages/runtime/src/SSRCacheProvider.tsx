import React from "react";

const Context = React.createContext({});

const isSSR = typeof window === 'undefined';

export const SSRCacheProvider = ({ children, cache }: { children: JSX.Element | JSX.Element[]; cache?: SSRCache }) => {
  let cacheValue = (isSSR ? cache : window.__SSR_CACHE__) || {};
  if (!isSSR) {
    Object.freeze(cacheValue);
  }

  return <Context.Provider value={cacheValue}>{children}</Context.Provider>;
}

export const useSSRCache = () => {
  console.log(typeof React, typeof Context, typeof React.useContext);
  return React.useContext(Context);
} 