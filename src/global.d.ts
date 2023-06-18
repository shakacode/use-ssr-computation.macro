declare global {
  type SSRCache = {
    [key: string]: {
       value: any;
    }
   }   
  interface Window {
    __SSR_CACHE__: SSRCache;
  }
}

export {};
