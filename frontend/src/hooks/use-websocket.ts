import { useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  url?: string;
  baseUrl?: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isWsConnected, setIsWsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(options.onMessage);

  // Luôn cập nhật callback mới nhất
  useEffect(() => {
    onMessageRef.current = options.onMessage;
  }, [options.onMessage]);

  const {
    url = undefined,
    baseUrl = process.env.NEXT_PUBLIC_WS_BASE,
    onOpen,
    onClose,
    onError,
  } = options;

  const enabled = url !== undefined;
  const fullPath = url ? (url.startsWith("/") ? url : `/${url}`) : "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = baseUrl || window.location.host;
  let wsUrl = "";

  if (host.startsWith("ws://") || host.startsWith("wss://")) {
    wsUrl = `${host}/ws${fullPath}`;
  } else {
    wsUrl = `${protocol}//${host}/ws${fullPath}`;
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsWsConnected(true);
      onOpen?.();
    };

    socket.onmessage = (event) => {
      console.log("WS raw message:", event.data);
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data); // Gọi callback mới nhất
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      setIsWsConnected(false);
      onClose?.();
    };

    socket.onerror = (error) => {
      onError?.(error);
    };

    return () => {
      socket.close();
    };
  }, [wsUrl, enabled]);

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const messageString = JSON.stringify(message);
      socketRef.current.send(messageString);
    } else {
      console.log(
        `[WS] Websocket is not ready ${socketRef.current?.readyState}`
      );
    }
  };

  const closeConnection = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  };

  return {
    isWsConnected,
    sendMessage,
    closeConnection,
  };
}
