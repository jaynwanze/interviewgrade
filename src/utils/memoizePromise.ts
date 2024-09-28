interface MemoizeOptions {
  expire?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promiseCache = new Map<string, Promise<any>>();

export function memoizePromise<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  options: MemoizeOptions = {},
): () => Promise<T> {
  return () => {
    let promise = promiseCache.get(cacheKey);
    console.log('exists in cache key');
    if (!promise) {
      promise = fetcher();
      promiseCache.set(cacheKey, promise);

      // Once the promise is settled, remove it from the cache
      promise.finally(() => {
        if (options.expire) {
          setTimeout(() => {
            promiseCache.delete(cacheKey);
          }, options.expire);
        } else {
          promiseCache.delete(cacheKey);
        }
      });
    }

    return promise;
  };
}
