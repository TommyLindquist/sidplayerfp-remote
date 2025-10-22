"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./ui/modal";
import FormSettings from "./ui/form-settings";
import { CustomButton } from "@/components/custom-button";
import { useSidSettings } from "@/hooks/useSidSettings";
import { OverlayControls } from "@/components/overlay-controls";
import { getOverlayZones, getMuteButtons } from "@/lib/controls";
import { handleOpen, sendIp } from "./utils";
import LayoutPlayerButtons from "./ui/layout-player-buttons";
import BufferIndicator from "@/components/buffer-indicator";
import Debug from "@/components/debug";
import { useSidCommands } from "@/hooks/useSidCommands";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useImageStream } from "@/hooks/useImageStream";
import { sendUDPCommand } from "@/lib/udp";

export default function Page() {
  const { sidplayerIp, yourIp, debugEnabled } = useSidSettings();
  const [ipSent, setIpSent] = useState(false);
  const repeatChecked = useRef(false);
  const [modalPos, setModalPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Send player IP to tcp-bridge
    if (!sidplayerIp || ipSent) return;
    (async () => await sendIp(sidplayerIp, (res) => setIpSent(res)))();
  }, [sidplayerIp, ipSent]);

  const {
    audioCtx,
    audioNodeRef,
    audioSocketRef,
    startAudio,
    stopAudio,
    resetAudio,
    bufferFill,
    isPrimed,
    isBuffering,
    playPause,
  } = useAudioPlayer(sidplayerIp, yourIp);

  const { imageSocketRef, imageUrl, startImages, stopImages, resetImages } =
    useImageStream(sidplayerIp, yourIp);

  const { send } = useSidCommands({
    sidplayerIp,
    audioCtx,
    audioNodeRef,
    audioSocketRef,
    imageSocketRef,
    resetAudio,
    resetImages,
    stopAudio,
    stopImages,
  });

  const overlayZones = getOverlayZones(
    send,
    startImages,
    audioNodeRef,
    repeatChecked,
    playPause
  );

  const muteSettingsButtons = getMuteButtons(send);

  return (
    <div className="p-2.5">
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
          startImages={startImages}
          repeatChecked={repeatChecked}
          playPause={playPause}
        />
      </section>

      <div className="mt-5 w-[460px] relative">
        <img
          src={imageUrl ?? "sidplayerFp.png"}
          alt="Live Stream"
          width={460}
          height={280}
          loading="eager" // skip lazy loading and prioritizes decoding.
          className="w-full h-auto border-0 object-contain will-change-transform"
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
          click={() => handleOpen({ buttonRef, setModalPos, setIsOpen })}
          className="ml-auto mt-5"
        />
        {isOpen && modalPos && (
          <Modal onClose={() => setIsOpen(false)}>
            <FormSettings
              position={modalPos}
              closeForm={() => setIsOpen(false)}
              restartScreen={() => {
                fetch("http://localhost:3003/restart-image", {
                  method: "POST",
                }); // forcibly restart image connection ...
                resetImages();
              }}
              restartAudio={() => {
                fetch("http://localhost:3003/restart-audio", {
                  method: "POST",
                }); // forcibly restart audio connection ...
                resetAudio();
                audioCtx.current?.resume();
                sendUDPCommand("replay", sidplayerIp);
              }}
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
