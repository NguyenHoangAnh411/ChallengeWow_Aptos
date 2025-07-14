import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  url?: string;
  baseUrl?: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: (wasClean: boolean) => void; // Thêm tham số để biết lý do đóng
  onError?: (error: Event) => void;
  shouldReconnect?: boolean; // Thêm tùy chọn để bật/tắt reconnect
  reconnectInterval?: number; // Thời gian chờ ban đầu
  reconnectAttempts?: number; // Số lần thử lại tối đa
}

const MAX_RECONNECT_INTERVAL = 30000; // 30 giây

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isWsConnected, setIsWsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // === Sử dụng useCallback để các hàm không bị tạo lại mỗi lần render ===
  const onMessageRef = useRef(options.onMessage);
  useEffect(() => {
    onMessageRef.current = options.onMessage;
  }, [options.onMessage]);

  const onOpenRef = useRef(options.onOpen);
  useEffect(() => {
    onOpenRef.current = options.onOpen;
  }, [options.onOpen]);

  const onCloseRef = useRef(options.onClose);
  useEffect(() => {
    onCloseRef.current = options.onClose;
  }, [options.onClose]);

  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const {
    url,
    baseUrl = process.env.NEXT_PUBLIC_WS_BASE,
    // === Thêm các tùy chọn mới với giá trị mặc định ===
    shouldReconnect = true,
    reconnectInterval = 1000,
    reconnectAttempts = 10,
  } = options;

  const enabled = url !== undefined;

  // === Tách logic tạo URL ra ngoài để có thể tái sử dụng ===
  const getWsUrl = useCallback(() => {
    if (!url) return "";
    const fullPath = url.startsWith("/") ? url : `/${url}`;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = baseUrl || window.location.host;

    if (host.startsWith("ws://") || host.startsWith("wss://")) {
      return `${host}/ws${fullPath}`;
    }
    return `${protocol}//${host}/ws${fullPath}`;
  }, [url, baseUrl]);

  // === Hàm để kết nối, có thể gọi lại được ===
  const connect = useCallback(() => {
    if (
      !enabled ||
      (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    // Hủy các timer reconnect cũ nếu có
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }

    const wsUrl = getWsUrl();
    console.log(`[WS] Attempting to connect to ${wsUrl}...`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[WS] Connection established.");
      setIsWsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset số lần thử lại khi thành công
      onOpenRef.current?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onclose = (event) => {
      console.log(
        `[WS] Connection closed. Clean: ${event.wasClean}, Code: ${event.code}`
      );
      setIsWsConnected(false);
      onCloseRef.current?.(event.wasClean);

      // === LOGIC TỰ ĐỘNG KẾT NỐI LẠI ===
      // Chỉ kết nối lại nếu kết nối không được đóng một cách "sạch" (ví dụ: server down)
      // và tùy chọn shouldReconnect được bật.
      if (shouldReconnect && !event.wasClean) {
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          const timeout = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1),
            MAX_RECONNECT_INTERVAL
          );
          console.log(
            `[WS] Will attempt to reconnect in ${timeout / 1000}s...`
          );
          reconnectTimeoutId.current = setTimeout(connect, timeout);
        } else {
          console.error("[WS] Max reconnect attempts reached.");
        }
      }
    };

    socket.onerror = (error) => {
      console.error("[WS] Error:", error);
      onErrorRef.current?.(error);
    };
  }, [
    enabled,
    getWsUrl,
    shouldReconnect,
    reconnectAttempts,
    reconnectInterval,
  ]);

  // === useEffect chính để khởi tạo và dọn dẹp ===
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Dọn dẹp khi component unmount
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (socketRef.current) {
        console.log("[WS] Closing connection on component unmount.");
        // Đặt shouldReconnect thành false tạm thời để ngăn việc kết nối lại khi tự mình đóng
        const originalShouldReconnect = shouldReconnect;
        options.shouldReconnect = false;
        socketRef.current.close(1000, "Component unmounting"); // Mã 1000 là đóng bình thường
        options.shouldReconnect = originalShouldReconnect;
      }
    };
  }, [enabled, connect]); // connect giờ là một dependency ổn định

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      socketRef.current.send(messageString);
    } else {
      console.warn(
        `[WS] Websocket is not ready to send. State: ${socketRef.current?.readyState}`
      );
    }
  };

  // Hàm này giờ không cần thiết lắm vì logic đóng đã nằm trong useEffect
  // nhưng vẫn giữ lại nếu muốn đóng thủ công
  const closeConnection = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WS] Closing connection manually.");
      socketRef.current.close();
    }
  };

  return {
    isWsConnected,
    sendMessage,
    closeConnection,
    // Có thể trả về cả socket instance nếu cần truy cập trực tiếp
    // socket: socketRef.current
  };
}
