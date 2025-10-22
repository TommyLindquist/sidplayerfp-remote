import { setupImageSocket } from "@/lib/image";
import { sendUDPCommand } from "@/lib/udp";
import { useRef, useState } from "react";

export function useImageStream(
  sidplayerIp: string | null,
  yourIp: string | null
) {
  const imageSocketRef = useRef<WebSocket | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const startImages = () => {
    sendUDPCommand(`getimagesatoff ${yourIp}`, sidplayerIp);
    sendUDPCommand(`getimagesaton ${yourIp}`, sidplayerIp);
    setupImageSocket(imageSocketRef, setImageUrl);
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
    imageUrl,
    startImages,
    stopImages,
    resetImages,
  };
}
