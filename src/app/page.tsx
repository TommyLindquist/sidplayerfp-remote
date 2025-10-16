"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./ui/modal";
import FormSettings from "./ui/form-settings";
import { CustomButton } from "@/components/custom-button";
import { setupAudioNode } from "@/lib/audio";
import { setupImageSocket } from "@/lib/image";
import { sendUDPCommand } from "@/lib/udp";
import { useSidSettings } from "@/hooks/useSidSettings";
import { OverlayControls } from "@/components/overlay-controls";
import { getOverlayZones, getMuteButtons } from "@/lib/controls";
import { handleOpen } from "./utils";
import LayoutPlayerButtons from "./ui/layout-player-buttons";
import BufferIndicator from "@/components/buffer-indicator";
import Debug from "@/components/debug";

export default function Page() {
  const { sidplayerIp, yourIp, debugEnabled } = useSidSettings();
  const [ipSent, setIpSent] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const audioNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioSocketRef = useRef<WebSocket | null>(null);
  const imageSocketRef = useRef<WebSocket | null>(null);
  const imageRingBuffer = useRef<string[]>([]);
  const bufferSize = 300;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [bufferFill, setBufferFill] = useState(0);
  const [isPrimed, setIsPrimed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const repeatChecked = useRef(false);
  const [modalPos, setModalPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidplayerIp || ipSent) return;
    fetch("http://localhost:3003/set-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: sidplayerIp }),
    }).then(() => setIpSent(true));
  }, [sidplayerIp, ipSent]);

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
      // give SID player time to switch tracks
      setTimeout(() => {
        audioNodeRef.current?.port.postMessage({ type: "flush" });
      }, 200);
      setTimeout(() => {
        audioNodeRef.current?.port.postMessage({ type: "flush" });
      }, 200);
      return;
    }

    if (msg === "stop") {
      stopAudio();
      audioNodeRef.current?.port.postMessage({ type: "flush" });
      sendUDPCommand(msg, sidplayerIp);
      return;
    }

    sendUDPCommand(msg, sidplayerIp);
  };

  const overlayZones = getOverlayZones(
    send,
    sendUDPCommand,
    startImages,
    resetAudio,
    audioNodeRef,
    audioCtx.current,
    audioSocketRef,
    repeatChecked,
    sidplayerIp ?? ""
  );

  const muteSettingsButtons = getMuteButtons(send);

  return (
    <div style={{ padding: 20 }}>
      {debugEnabled && (
        <Debug 
          startAudio={startAudio}
          stopAudio={stopAudio}
          startImages={startImages}
          stopImages={stopImages}
          audioCtx={audioCtx}
          resetImages={resetImages}
          resetAudio={resetAudio}
          send={send}
          audioNodeRef={audioNodeRef}
        />
      )}

      <section
        className="grid grid-rows-4 grid-cols-6 gap-1 w-[460px]"
        style={{
          gridTemplateAreas: `
              ". . stop stop . ."
              ". stepbackward playpause playpause stepforward ."
              "decreasevolume decreasevolume decreasevolume increasevolume increasevolume increasevolume"
              "gainlower gainlower repeat repeat gainraise gainraise"
            `,
        }}
      >
        <LayoutPlayerButtons
          send={send}
          audioNodeRef={audioNodeRef}
          resetAudio={resetAudio}
          sendUDPCommand={sendUDPCommand}
          audioCtx={audioCtx}
          audioSocketRef={audioSocketRef}
          sidplayerIp={sidplayerIp}
          startImages={startImages}
          repeatChecked={repeatChecked}
        />
      </section>

      <div className="mt-5" style={{ width: 460, position: "relative" }}>
        <img
          src={imageUrl ?? "sidplayerFp.png"}
          alt="Live Stream"
          width={460}
          height={280}
          loading="eager" // skip lazy loading and prioritizes decoding.
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            border: 0,
            willChange: "transform",
          }}
        />

        <OverlayControls
          overlayZones={overlayZones}
          muteButtons={muteSettingsButtons}
          debug={debugEnabled}
        />
      </div>

      <div className="flex gap-3 w-[460px] items-baseline">
        <CustomButton
          ref={buttonRef}
          text="Settings"
          click={() => handleOpen({buttonRef, setModalPos, setIsOpen})}
          className="ml-auto mt-5"
        />
        {isOpen && modalPos && (
          <Modal onClose={() => setIsOpen(false)}>
            <FormSettings
              position={modalPos}
              closeForm={() => setIsOpen(false)}
            />
          </Modal>
        )}
      </div>

      <BufferIndicator
        bufferFill={bufferFill}
        isBuffering={isBuffering}
        isPrimed={isPrimed}
      />
    </div>
  );
}
