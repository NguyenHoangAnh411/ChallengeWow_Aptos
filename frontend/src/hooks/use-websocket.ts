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
  const {
    url = undefined,
    baseUrl = process.env.NEXT_PUBLIC_WS_BASE,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  const enabled = url !== undefined;
  const fullPath = url ? (url.startsWith("/") ? url : `/${url}`) : "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = baseUrl || window.location.host;
  const wsUrl = `${protocol}//${host}/ws${fullPath}`;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[WS] Connected!");
      setIsWsConnected(true);
      onOpen?.();
    };

    socket.onmessage = (event) => {
      console.log("[WS RAW]", event.data); // ➜ phải thấy JSON string ở đây
      try {
        const data = JSON.parse(event.data);
        console.log("[WS MESSAGE PARSED]", data);
        onMessage?.(data);
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
      console.log("[WS] useEffect cleanup");
      socket.close();
    };
  }, [wsUrl]);

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.log(
        `[WS] Websocket is not ready ${socketRef.current?.readyState}`
      );
    }
  };

  return {
    isWsConnected,
    sendMessage,
  };
}
