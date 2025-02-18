// hooks/useTokens.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Token } from '@/types';
import { getCurrentEmployeeTokens } from '@/data/user/employee';

/**
 * React Query hook to fetch the user's tokens from your server method
 */
export function useTokens() {
  return useQuery<Token | null>({
    queryKey: ['tokens'],
    queryFn: async () => {
      // This calls your existing fetch function
      const tokens = await getCurrentEmployeeTokens();
      return tokens;
    },
    // Optionally: staleTime, cacheTime, etc.
    // staleTime: 30_000, // e.g. 30 seconds
  });
}

/**
 * A small helper to "invalidate" or refetch tokens from anywhere
 */
export function useRefreshTokens() {
  const queryClient = useQueryClient();
  return () => {
    // This tells React Query that the data for ['tokens'] is no longer fresh
    // and that it should re-fetch the next time it’s accessed
    queryClient.invalidateQueries(['tokens']);
  };
}
