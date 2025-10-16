"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "./ui/modal";
import FormSettings from "./ui/form-settings";
import { CustomButton } from "@/components/custom-button";
import { setupAudioNode } from '@/lib/audio';
import { setupImageSocket } from '@/lib/image';
import { sendUDPCommand } from '@/lib/udp';
import { useSidSettings } from '@/hooks/useSidSettings';
import { OverlayControls } from '@/components/overlay-controls';
import { getOverlayZones, getMuteButtons } from '@/lib/controls';
import { clearSidCookie } from "./utils";

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
  const [modalPos, setModalPos] = useState<{ top: number; left: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const handleOpen = () => {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (rect) {
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;
    setModalPos({ top: centerY, left: centerX });
    setIsOpen(true);
  }
};

  useEffect(() => {
  if (!sidplayerIp || ipSent) return;
  fetch('http://localhost:3003/set-ip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip: sidplayerIp }),
  }).then(() => setIpSent(true));
}, [sidplayerIp, ipSent]);

  const startAudio = async () => {
    if (audioCtx.current) return;

    const ctx = new AudioContext({ sampleRate: 48000 });
    if (ctx.state === 'suspended') await ctx.resume();
    audioCtx.current = ctx;

    await setupAudioNode(ctx, audioNodeRef, audioSocketRef, ({ fillRatio, isPrimed, buffering }) => {
      setBufferFill(fillRatio);
      setIsPrimed(isPrimed);
      setIsBuffering(buffering);
    });

    sendUDPCommand(`getmusicatoff ${yourIp}`, sidplayerIp);
    sendUDPCommand(`getmusicaton ${yourIp}`, sidplayerIp);
  };

  const stopAudio = () => {
    sendUDPCommand(`getmusicatoff ${yourIp}`, sidplayerIp);
    sendUDPCommand('stop', sidplayerIp);

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

    if(msg === 'playpause'){
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

    if (msg === 'stop') {
      stopAudio();
      audioNodeRef.current?.port.postMessage({ type: 'flush' });
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

      {debugEnabled && (<aside className="w-[460px]">
      <h1 className="flex justify-center" style={{ fontSize: '24px', fontWeight: 'bold', color: '#6750a4' }}>SID PlayerFP Remote debug</h1>
      <div className="flex justify-center">
      <div className="flex justify-between mb-[20px] mt-1 w-[300px]">
        <div className="flex flex-col space-y-2">
        <button onClick={startAudio}>Start Audio</button>
        <button onClick={stopAudio}>Stop Audio</button>
        <button onClick={startImages}>Start Images</button>
        <button onClick={stopImages}>Stop Images</button>
        <button onClick={() => audioCtx.current?.resume()}>Resume Audio</button>
        </div>
        <div className="flex flex-col space-y-2 items-end">
        <button onClick={resetImages}>Reset Images</button>
        <button onClick={resetAudio}>Reset Audio</button>
        <button onClick={() => send("replay")}>Send replay</button>
        <button onClick={() => audioNodeRef.current?.port.postMessage({ type: "flush" })}>Flush buffer</button>
        <button onClick={() => clearSidCookie()}>Delete cookie</button>
        </div>
      </div>
      </div>
      </aside>)}
      
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
        <CustomButton
          text="Stop"
          click={() => {
            send("stop"); 
          }}
          styles={{ gridArea: "stop" }}
        />
        <CustomButton
          text="<"
          click={() => {
            send("stepbackward");
            setTimeout(() => {
              audioNodeRef.current?.port.postMessage({ type: "flush" });
            }, 200); // give SID player time to switch tracks
          }}
          styles={{ gridArea: "stepbackward" }}
        />
        <CustomButton
          text="Play / Pause"
          click={async () => {
            if (!audioCtx || !audioSocketRef.current) {
              await resetAudio(); // full restart
              sendUDPCommand("replay", sidplayerIp);
              startImages(); // safe to start images
            } else {
              send("playpause"); // toggle normally
            }
          }}
          styles={{ gridArea: "playpause" }}
        />
        <CustomButton
          text=">"
          click={() => {
            send("stepforward");
            setTimeout(() => {
              audioNodeRef.current?.port.postMessage({ type: "flush" });
            }, 200); // give SID player time to switch tracks
          }}
          styles={{ gridArea: "stepforward" }}
        />
        <CustomButton
          text="Volume -"
          click={() => send("decreasevolume")}
          styles={{ gridArea: "decreasevolume" }}
          className="ml-5 mr-5"
        />
        <CustomButton
          text="Volume +"
          click={() => send("increasevolume")}
          styles={{ gridArea: "increasevolume" }}
          className="mr-5 ml-5"
        />
        <CustomButton
          text="Gain -"
          click={() => send("gainlower")}
          styles={{ gridArea: "gainlower" }}
        />
        <CustomButton
          text="Repeat"
          click={() =>
            send(
              `repeat${
                (repeatChecked.current = !repeatChecked.current) ? "on" : "off"
              }`
            )
          }
          styles={{ gridArea: "repeat" }}
        />
        <CustomButton
          text="Gain +"
          click={() => send("gainraise")}
          styles={{ gridArea: "gainraise" }}
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
        click={handleOpen}
        className="ml-auto mt-5"
      />
      {isOpen && modalPos && (
        <Modal onClose={() => setIsOpen(false)}>
          <FormSettings position={modalPos} closeForm={() => setIsOpen(false)} />
        </Modal>
      )}
      </div>
        <div className="mt-[20px] w-[460px]">
        <label>Buffer Fill:</label>
        <div
          style={{
            width: "100%",
            height: 10,
            background: "#ccc",
            marginTop: 4,
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${(bufferFill * 100).toFixed(1)}%`,
              height: "100%",
              background: bufferFill > 0.0853 ? "#4caf50" : "#f44336",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <div style={{ fontSize: 12, marginTop: 8 }}>
          {isBuffering
            ? "⏳ Buffering…"
            : isPrimed
            ? "✅ Ready to play"
            : "⏳ Waiting for buffer…"}
        </div>
        </div>
    </div>
  );}
