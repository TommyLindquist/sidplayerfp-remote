import { setupImageSocket } from "@/lib/image";
import { sendUDPCommand } from "@/lib/udp";
import { useRef, useState } from "react";

export function useImageStream(
  sidplayerIp: string | null,
  yourIp: string | null
) {
  const imageSocketRef = useRef<WebSocket | null>(null);
  const imageRingBuffer = useRef<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const bufferSize = 500; // image strings buffer for display images as a video ...

  const startImages = () => {
    sendUDPCommand(`getimagesatoff ${yourIp}`, sidplayerIp);
    sendUDPCommand(`getimagesaton ${yourIp}`, sidplayerIp);
    setupImageSocket(imageSocketRef, imageRingBuffer, bufferSize, setImageUrl);
  };

  const stopImages = () => {
    sendUDPCommand(`getimagesatoff ${yourIp}`, sidplayerIp);
    imageSocketRef.current?.close();
    imageSocketRef.current = null;
    setImageUrl(null);
  };

  const resetImages = async () => {
    stopImages();
    await new Promise((r) => setTimeout(r, 1000));
    startImages();
  };

  return {
    imageSocketRef,
    imageRingBuffer,
    imageUrl,
    startImages,
    stopImages,
    resetImages,
  };
}
