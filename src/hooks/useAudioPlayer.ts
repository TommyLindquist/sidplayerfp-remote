import { setupAudioNode } from "@/lib/audio";
import { sendUDPCommand } from "@/lib/udp";
import { useRef, useState } from "react";

export function useAudioPlayer(
  sidplayerIp: string | null,
  yourIp: string | null
) {
  const audioCtx = useRef<AudioContext | null>(null);
  const audioNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioSocketRef = useRef<WebSocket | null>(null);
  const [bufferFill, setBufferFill] = useState(0);
  const [isPrimed, setIsPrimed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const startAudio = async () => {
    if (audioCtx.current) return;

    const ctx = new AudioContext({ sampleRate: 48000 });
    if (ctx.state === "suspended") await ctx.resume();
    audioCtx.current = ctx;

    await setupAudioNode(
      ctx,
      audioNodeRef,
      audioSocketRef,
      ({ fillRatio, isPrimed, buffering }) => {
        setBufferFill(fillRatio);
        setIsPrimed(isPrimed);
        setIsBuffering(buffering);
      }
    );

    sendUDPCommand(`getmusicatoff ${yourIp}`, sidplayerIp);
    sendUDPCommand(`getmusicaton ${yourIp}`, sidplayerIp);
  };

  const stopAudio = () => {
    sendUDPCommand(`getmusicatoff ${yourIp}`, sidplayerIp);
    sendUDPCommand("stop", sidplayerIp);

    audioSocketRef.current?.close();
    audioSocketRef.current = null;

    audioNodeRef.current?.disconnect();
    audioNodeRef.current = null;

    audioCtx.current?.close();
    audioCtx.current = null;

    setIsPrimed(false);
    setBufferFill(0);
  };
  const resetAudio = async () => {
    stopAudio();
    await new Promise((r) => setTimeout(r, 200));
    await startAudio();
  };

  return {
    audioCtx,
    audioNodeRef,
    audioSocketRef,
    bufferFill,
    isPrimed,
    isBuffering,
    startAudio,
    stopAudio,
    resetAudio,
  };
}
