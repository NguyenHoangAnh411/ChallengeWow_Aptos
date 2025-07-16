import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { joinRoom } from "@/lib/api";
import { useGameState } from "@/lib/game-state";
import { toast } from "./use-toast"; // Đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn

/**
 * Định nghĩa kiểu dữ liệu cho các biến đầu vào được truyền vào mutation.
 * Bắt buộc người dùng chỉ cung cấp `roomCode` hoặc `roomId`, không phải cả hai,
 * để đảm bảo ý định rõ ràng.
 */
type JoinRoomVariables =
  | { roomCode: string; roomId?: never }
  | { roomId: string; roomCode?: never };

/**
 * Định nghĩa kiểu dữ liệu chính xác mà API /join-room trả về.
 * Rất quan trọng để đảm bảo an toàn kiểu dữ liệu trong callback `onSuccess`.
 */
interface JoinRoomResponse {
  roomId: string;
  walletId: string;
}

/**
 * Hook tùy chỉnh để xử lý hành động tham gia vào một phòng chơi.
 *
 * Chức năng:
 * - Quản lý trạng thái tải và lỗi khi gọi API.
 * - Xử lý logic nghiệp vụ như kiểm tra người dùng đã đăng nhập chưa.
 * - Hiển thị thông báo toast thân thiện cho người dùng về kết quả (thành công/thất bại).
 * - Tự động điều hướng người dùng đến phòng chờ sau khi tham gia thành công.
 * - Vô hiệu hóa các truy vấn liên quan (`rooms`, `userGameHistories`) để làm mới dữ liệu.
 * - Linh hoạt, cho phép tham gia bằng cả `roomCode` hoặc `roomId`.
 *
 * @returns Mutation object từ TanStack Query, bao gồm hàm `mutate` để kích hoạt và các trạng thái như `isPending`.
 */
export const useJoinRoomMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useGameState();

  // Khởi tạo mutation với các kiểu dữ liệu đã được định nghĩa chính xác.
  // <JoinRoomResponse, Error, JoinRoomVariables>
  return useMutation<JoinRoomResponse, Error, JoinRoomVariables>({
    /**
     * mutationFn: Hàm thực hiện yêu cầu API.
     * Nó nhận các biến (`variables`) từ lời gọi `mutate`.
     */
    mutationFn: (variables) => {
      // Guard Clause: Đây là một lớp bảo vệ ở phía client.
      // Ngăn chặn việc gọi API nếu người dùng chưa kết nối ví.
      if (!currentUser?.walletId) {
        // Trả về một Promise bị từ chối sẽ kích hoạt callback `onError`.
        return Promise.reject(new Error("Please connect your wallet first."));
      }

      // Gọi hàm API với đầy đủ thông tin cần thiết.
      return joinRoom({
        ...variables, // Sẽ chứa `{roomCode: string}` hoặc `{roomId: string}`
        username: currentUser.username,
        walletId: currentUser.walletId,
      });
    },

    /**
     * onSuccess: Callback được gọi khi API trả về kết quả thành công.
     * @param data - Dữ liệu trả về từ `mutationFn`, có kiểu là `JoinRoomResponse`.
     */
    onSuccess: (data) => {
      // Vô hiệu hóa các truy vấn trong bộ đệm để React Query tự động tìm nạp lại dữ liệu mới nhất.
      // Điều này giữ cho giao diện người dùng luôn được đồng bộ.
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["userGameHistories"] });

      // Hiển thị thông báo thành công.
      // Vì API không trả về `roomCode`, chúng ta hiển thị một thông báo chung.
      toast({
        title: "Room Joined!",
        description: "You have successfully joined the room. Redirecting...",
      });

      // Luôn sử dụng `data.roomId` để điều hướng.
      // Đây là nguồn dữ liệu đáng tin cậy nhất vì nó đến từ server.
      router.push(`/room/${data.roomId}/waiting`);
    },

    /**
     * onError: Callback được gọi khi `mutationFn` ném ra lỗi hoặc trả về một Promise bị từ chối.
     * @param error - Đối tượng lỗi.
     */
    onError: (error) => {
      // Hiển thị thông báo lỗi thân thiện cho người dùng.
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
