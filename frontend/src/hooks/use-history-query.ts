import { useInfiniteQuery } from "@tanstack/react-query";
import { Room } from "@/types/schema";
import { fetchHistories } from "@/lib/api";
import { GameStatus } from "@/types/GameStatus";

export const useInfiniteHistoryQuery = (
  walletId?: string,
  status?: GameStatus,
  limit = 10
) => {
  return useInfiniteQuery<Room[], Error>({
    queryKey: ["userGameHistories", walletId, status],

    queryFn: async ({ pageParam = 0 }) => {
      if (!walletId) {
        return [];
      }

      const res = await fetchHistories(
        walletId,
        limit,
        pageParam as number,
        status
      );

      return res;
    },

    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) {
        return undefined;
      }

      return allPages.length * limit;
    },

    initialPageParam: 0,

    enabled: Boolean(walletId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
