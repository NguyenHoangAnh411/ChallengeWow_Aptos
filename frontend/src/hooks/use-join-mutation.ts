import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { joinRoom } from "@/lib/api";
import { Room } from "@/types/schema"; // Giả sử API trả về đối tượng Room
import { useGameState } from "@/lib/game-state"; // Để lấy currentUser
import { toast } from "./use-toast";

// Định nghĩa kiểu dữ liệu như trên
type JoinRoomVariables =
  | { roomCode: string; roomId?: never }
  | { roomId: string; roomCode?: never };

/**
 * Hook tùy chỉnh để xử lý việc tham gia vào một phòng chơi.
 * Linh hoạt, có thể tham gia bằng roomCode hoặc roomId.
 */
export const useJoinRoomMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useGameState();

  return useMutation<Room, Error, JoinRoomVariables>({
    // mutationFn được tối ưu hóa để xử lý logic và kiểm tra
    mutationFn: (variables) => {
      // TỐI ƯU HÓA 1: Kiểm tra người dùng trước khi gọi API
      if (!currentUser?.walletId) {
        // Ném lỗi để onError có thể bắt được, hoặc trả về một Promise bị từ chối
        return Promise.reject(new Error("User not authenticated."));
      }

      // Gọi API với đầy đủ thông tin
      return joinRoom({
        ...variables, // Sẽ chứa hoặc roomId hoặc roomCode
        username: currentUser.username,
        walletId: currentUser.walletId,
      });
    },

    // onSuccess được tối ưu hóa để sử dụng dữ liệu trả về
    onSuccess: (data) => {
      // `data` là kết quả từ API (đối tượng Room)
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Giữ nguyên, rất tốt!

      toast({
        title: "Room Joined!",
        description: `Successfully joined room #${data.roomCode}.`, // Thông báo cụ thể hơn
      });

      // TỐI ƯU HÓA 2: Luôn sử dụng ID từ dữ liệu trả về để điều hướng
      // Điều này đảm bảo nó luôn đúng, bất kể bạn tham gia bằng cách nào.
      router.push(`/room/${data.id}/waiting`);
    },

    onError: (error) => {
      // Nhận đối tượng lỗi
      toast({
        title: "Failed to Join Room",
        description:
          error.message ||
          "The room might be full, unavailable, or does not exist.",
        variant: "destructive",
      });
    },
  });
};
