import { RefObject } from "react";

export function setupImageSocket(
  socketRef: RefObject<WebSocket | null>,
  setImageUrl: (url: string) => void
) {
  if (socketRef.current) {
    socketRef.current.close();
    socketRef.current.onmessage = null;
  }

  const socket = new WebSocket("ws://localhost:3002/images");
  socketRef.current = socket;

  socket.onmessage = (event) => {
    const base64 = typeof event.data === "string" ? event.data : null;
    if (base64?.startsWith("data:image")) {
      setImageUrl(base64);
    }
  };

  socket.onerror = (err) => console.error("Image WebSocket error:", err);
  socket.onclose = () => console.log("Image WebSocket closed");
}
