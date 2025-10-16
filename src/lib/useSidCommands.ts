import { sendUDPCommand } from "./udp";

export function useSidCommands({
  sidplayerIp,
  audioCtx,
  audioNodeRef,
  audioSocketRef,
  imageSocketRef,
  resetAudio,
  resetImages,
}: {
  sidplayerIp: string | null;
  audioCtx: React.RefObject<AudioContext | null>;
  audioNodeRef: React.RefObject<AudioWorkletNode | null>;
  audioSocketRef: React.RefObject<WebSocket | null>;
  imageSocketRef: React.RefObject<WebSocket | null>;
  resetAudio: () => Promise<void>;
  resetImages: () => Promise<void>;
}) {
  const send = (msg: string) => {
    if (!imageSocketRef.current) {
      resetImages();
    }

    if (msg === "playpause") {
      if (!audioSocketRef.current || !audioCtx.current) {
        resetAudio();
        audioCtx.current?.resume();
        return;
      }
      sendUDPCommand(msg, sidplayerIp);
      setTimeout(() => {
        audioNodeRef.current?.port.postMessage({ type: "flush" });
      }, 200);
      return;
    }

    if (msg === "stop") {
      resetAudio(); // or stopAudio() if you prefer
      audioNodeRef.current?.port.postMessage({ type: "flush" });
      sendUDPCommand(msg, sidplayerIp);
      return;
    }

    sendUDPCommand(msg, sidplayerIp);
  };

  return { send };
}
