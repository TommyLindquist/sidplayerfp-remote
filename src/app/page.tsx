"use client";

import { useEffect, useRef, useState } from "react";
import { getSettingsFromCookie } from "./utils";
import { Modal } from "./ui/modal";
import FormSettings from "./ui/form-settings";
import { CustomButton } from "@/components/custom-button";

export default function Page() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const audioNodeRef = useRef<AudioWorkletNode | null>(null);

  const currentIp = "127.0.0.1";
  const audioSocketRef = useRef<WebSocket | null>(null);
  const imageSocketRef = useRef<WebSocket | null>(null);
  const imageRingBuffer = useRef<string[]>([]);
  const bufferSize = 300;
  const [bufferFill, setBufferFill] = useState(0);
  const [ipSent, setIpSent] = useState(false);
  // for settings
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [modalPos, setModalPos] = useState<{ top: number; left: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (rect) {
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;
    setModalPos({ top: centerY, left: centerX });
    setIsOpen(true);
  }
};

  const [sidplayerIp, setSidplayerIp] = useState<string | null>(null);
  const [enableDebug, setDebugEnabled] = useState(false);

  // Get settings from cookie if any inklude sidplayer IP
  useEffect(() => {
    const { sidIp, debugEnabled } = getSettingsFromCookie();
    setSidplayerIp(sidIp || null);
    setDebugEnabled(debugEnabled);
  }, []);

  const sendUDPCommand = (cmd: string) => {
    fetch("http://localhost:3001/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: cmd,
      targetIP: sidplayerIp
    }),
    });
  };

useEffect(() => {
  if (!sidplayerIp || ipSent) return;
  // Send player IP to tcp-bridge
  fetch('http://localhost:3003/set-ip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip: sidplayerIp })
  }).then(() => setIpSent(true));
}, [sidplayerIp, ipSent]);


  const setupAudio = async (ctx: AudioContext) => {
    await ctx.audioWorklet.addModule("/sid-processor.js");

    if (audioNodeRef.current) {
      audioNodeRef.current.disconnect();
      audioNodeRef.current = null;
    }

    const node = new AudioWorkletNode(ctx, "sid-processor", {
      outputChannelCount: [2],
    });
    node.connect(ctx.destination);
    audioNodeRef.current = node;

    // Clean up previous socket
    if (audioSocketRef.current) {
      audioSocketRef.current.onmessage = null;
      audioSocketRef.current.close();
      audioSocketRef.current = null;
    }

    const socket = new WebSocket("ws://localhost:3002/audio");
    audioSocketRef.current = socket;
    socket.binaryType = "arraybuffer";

    socket.onmessage = (event) => {
      const raw = new DataView(event.data);
      const samples = raw.byteLength / 4;
      const left = new Float32Array(samples);
      const right = new Float32Array(samples);

      for (let i = 0; i < samples; i++) {
        left[i] = raw.getInt16(i * 4, true) / 32768;
        right[i] = raw.getInt16(i * 4 + 2, true) / 32768;
      }

      node.port.postMessage({ left, right });
    };

      node.port.onmessage = (event) => {
      const { type, fillRatio} = event.data;

      if (type === "status") {
        setBufferFill(fillRatio);
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && ctx.state === "suspended") {
        ctx.resume();
      }
    });
  };

  const setupImages = () => {
    const socket = new WebSocket("ws://localhost:3002/images");
    imageSocketRef.current = socket;

    socket.onmessage = (event) => {
      const base64 = typeof event.data === "string" ? event.data : null;
      if (base64 && base64.startsWith("data:image")) {
        const buf = imageRingBuffer.current;
        if (buf.length >= bufferSize) buf.shift(); // remove oldest
        buf.push(base64);
        setImageUrl(base64); // show latest immediately
      }
    };

    socket.onerror = (err) => {
      console.error("Image WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("Image WebSocket closed");
    };
  };

  // useEffect(() => {
  //   return () => {
  //     // Cleanup if needed
  //     if (audioSocketRef.current) {
  //       audioSocketRef.current.close();
  //       audioSocketRef.current = null;
  //     }
  //     if (audioCtx) {
  //       audioCtx.close();
  //       setAudioCtx(null);
  //     }
  //   };
  // }, []);

  const startAudio = async () => {
    if (audioCtx) return;

    const ctx = new AudioContext({ sampleRate: 48000 });
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    setAudioCtx(ctx);
    await setupAudio(ctx);

    sendUDPCommand("getmusicatoff " + currentIp);
    sendUDPCommand("getmusicaton " + currentIp);
    sendUDPCommand("playpause");
  };

  const stopAudio = () => {
    sendUDPCommand("getmusicatoff " + currentIp);
    sendUDPCommand("stop");

    if (audioSocketRef.current) {
      audioSocketRef.current.onmessage = null;
      audioSocketRef.current.close();
      audioSocketRef.current = null;
    }

    if (audioNodeRef.current) {
      audioNodeRef.current.disconnect();
      audioNodeRef.current = null;
    }

    if (audioCtx) {
      audioCtx.close();
      setAudioCtx(null);
    }
    setBufferFill(0);
  };

  const resetAudio = async () => {
    stopAudio();
    await new Promise((r) => setTimeout(r, 200)); // give SID player time to reset
    await startAudio();
  };

  const resetImages = async () => {
    stopImages(); // close socket and clear image
    await new Promise((r) => setTimeout(r, 200)); // give backend time to reset
    startImages(); // reopen socket and resume stream
  };

  const send = async (msg: string, justSend = false) => {
    if (msg !== "playpause") {
      if (!justSend) {
        if (msg === "stop") {
          stopAudio();
          await new Promise((r) => setTimeout(r, 200)); // give SID player time to reset
          audioNodeRef?.current?.port.postMessage({ type: "flush" });
        } else if (!audioSocketRef.current || !audioCtx) {
          await resetAudio();
          audioNodeRef?.current?.port.postMessage({ type: "flush" });
          send("playpause", true);
          return;
        }

        if (!imageSocketRef.current) {
          await resetImages();
        }
      }
    }
    sendUDPCommand(msg);
  };

  const startImages = () => {
    sendUDPCommand("getimagesatoff " + currentIp);
    sendUDPCommand("getimagesaton " + currentIp);
    setupImages();
  };

  const stopImages = () => {
    sendUDPCommand("getimagesatoff " + currentIp);
    if (imageSocketRef.current) {
      imageSocketRef.current.close();
      imageSocketRef.current = null;
    }
    setImageUrl(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>SID PlayerFP Remote</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={startAudio}>Start Audio</button>
        <br />
        <button onClick={stopAudio}>Stop Audio</button>
        <br />
        <button onClick={startImages}>Start Images</button>
        <br />
        <button onClick={stopImages}>Stop Images</button>
        <br />
        <button onClick={() => audioCtx?.resume()}>Resume Audio</button>
      </div>

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


    </div>
  );}
