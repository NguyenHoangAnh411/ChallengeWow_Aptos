import { useQuery } from "@tanstack/react-query";
import { fetchRoomById } from "@/lib/api"; // Import hàm API của bạn
import { Room } from "@/types/schema"; // Import interface Room của bạn
import { GameStatus } from "@/types/GameStatus";

interface ApiError extends Error {
  response?: {
    status: number;
  };
}

/**
 * Hook tùy chỉnh để tìm nạp thông tin chi tiết của một phòng chơi.
 * @param roomId - ID của phòng cần tìm nạp. Hook sẽ bị vô hiệu hóa nếu ID không hợp lệ.
 * @param options - Các tùy chọn bổ sung, ví dụ như bật/tắt tính năng real-time.
 */
export const useRoomQuery = (roomId?: string) => {
  return useQuery<Room, ApiError>({
    queryKey: ["room", roomId],

    queryFn: async () => {
      if (!roomId) {
        throw new Error("Room ID is required to fetch data.");
      }
      return fetchRoomById(roomId);
    },

    // Tối ưu hóa 2: Sử dụng `!!` là một idiom phổ biến và ngắn gọn hơn.
    enabled: Boolean(roomId),

    // Tối ưu hóa 3: Tự động cập nhật dữ liệu (Polling) một cách có điều kiện.
    // Chỉ bật khi được yêu cầu, ví dụ khi game đang diễn ra.
    refetchInterval: (query) => {
      const room = query.state.data;
      if (
        room?.status === GameStatus.IN_PROGRESS ||
        room?.status === GameStatus.COUNTING_DOWN
      ) {
        return 5000;
      }
      return false;
    },

    staleTime: 10 * 1000,

    // Tối ưu hóa 4: Xử lý việc thử lại (retry) thông minh hơn.
    // Không thử lại nếu lỗi là "404 Not Found", vì phòng sẽ không đột nhiên xuất hiện.
    retry: (failureCount, error) => {
      if (error.response?.status === 404) {
        return false; // Không thử lại
      }
      // Mặc định, thử lại 3 lần
      return failureCount < 3;
    },
  });
};
