import { QueryFunction, QueryKey, useQuery } from '@tanstack/react-query';

// We only need this until Next.js parallel slots
// become error free. Right now they have numerous issues
// with route-groups, parallel slots and developer mode reloads.
// This hook is useful for fetching data in the client side
// while suspending the rendering of the page until the data has loaded.
export function useClientSuspenseQuery<
  TData = unknown,
  TKey extends QueryKey = QueryKey,
>(key: TKey, fetcher: QueryFunction<TData, TKey>): TData {
  const response = useQuery<TData, unknown, TData, QueryKey>(key, fetcher, {
    suspense: true,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  if (response.status === 'error') {
    throw response.error;
  } else if (response.status === 'loading') {
    throw new Error('Unreachable state in suspense mode');
  } else {
    return response.data;
  }
}
