import { RefObject } from "react";

export function setupImageSocket(
  socketRef: RefObject<WebSocket | null>,
  bufferRef: RefObject<string[]>,
  bufferSize: number,
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
      const buf = bufferRef.current;
      if (buf.length >= bufferSize) buf.shift();
      buf.push(base64);
      setImageUrl(base64);
    }
  };

  socket.onerror = (err) => console.error("Image WebSocket error:", err);
  socket.onclose = () => console.log("Image WebSocket closed");
}
