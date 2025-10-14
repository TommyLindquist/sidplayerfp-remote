"use client";

import { useEffect, useRef, useState } from "react";
import { getSettingsFromCookie } from "./utils";
import { Modal } from "./ui/modal";
import FormSettings from "./ui/form-settings";
import { CustomButton } from "@/components/custom-button";
import { MuteSettingsButton } from "@/components/mute-settings-button";

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
  const [isPrimed, setIsPrimed] = useState(false);
  const [ipSent, setIpSent] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [muteSetting, setMuteSetting] = useState(["", "", "", "", ""]);
  let repeatChecked = useRef<boolean>(false);


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
      const { type, fillRatio, isPrimed, buffering } = event.data;

      if (type === "status") {
        setBufferFill(fillRatio);
        setIsPrimed(isPrimed);
        setIsBuffering(buffering);
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
    setIsPrimed(false);
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

    const useMuteSettingNumber = (nr: number) =>
    setMuteSetting(Array.from({ length: 5 }, (_, i) => (i === nr ? "*" : "")));

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

    const overlayZones = [
    {
      id: "play",
      topPx: 151,
      leftPx: 295,
      widthPx: 20,
      heightPx: 20,
      onClick: async () => {
        if (!audioCtx || !audioSocketRef.current) {
          await resetAudio(); // full restart
          send("playpause"); // safe to toggle ON
        } else {
          send("playpause"); // toggle normally
        }
      },
    },
    {
      id: "stop",
      topPx: 151,
      leftPx: 358,
      widthPx: 20,
      heightPx: 20,
      onClick: () => send("stop"),
    },
    {
      id: "stepforward",
      topPx: 151,
      leftPx: 387,
      widthPx: 20,
      heightPx: 20,
      onClick: () => {
        send("stepforward");
        setTimeout(() => {
          audioNodeRef.current?.port.postMessage({ type: "flush" });
        }, 200); // give SID player time to switch tracks
      },
    },
    {
      id: "stepbackward",
      topPx: 151,
      leftPx: 263,
      widthPx: 20,
      heightPx: 20,
      onClick: () => {
        send("stepbackward");
        setTimeout(() => {
          audioNodeRef.current?.port.postMessage({ type: "flush" });
        }, 200); // give SID player time to switch tracks
      },
    },
    {
      id: "repeat",
      topPx: 161,
      leftPx: 11,
      widthPx: 12,
      heightPx: 12,
      onClick: () =>
        send(
          `repeat${
            (repeatChecked.current = !repeatChecked.current) ? "on" : "off"
          }`
        ),
    },
    {
      id: "mute0",
      topPx: 155,
      leftPx: 88,
      widthPx: 20,
      heightPx: 20,
      onClick: () => send("mutesetting0"),
    },
    {
      id: "mute1",
      topPx: 155,
      leftPx: 116,
      widthPx: 21,
      heightPx: 20,
      onClick: () => send("mutesetting1"),
    },
    {
      id: "mute2",
      topPx: 155,
      leftPx: 145,
      widthPx: 21,
      heightPx: 20,
      onClick: () => send("mutesetting2"),
    },
    {
      id: "mute3",
      topPx: 155,
      leftPx: 174,
      widthPx: 21,
      heightPx: 20,
      onClick: () => send("mutesetting3"),
    },
    {
      id: "mute4",
      topPx: 155,
      leftPx: 200,
      widthPx: 24,
      heightPx: 20,
      onClick: () => send("mutesetting4"),
    },
  ];

  const muteSettingsButtons = [
    {
      bgColor: "rgba(158, 0, 255, 255)",
      click: () => {
        send("mutesetting0");
        useMuteSettingNumber(0);
      },
    },
    {
      bgColor: "rgba(255, 176, 0, 23)",
      click: () => {
        send("mutesetting1");
        useMuteSettingNumber(1);
      },
    },
    {
      bgColor: "rgba(211, 140, 53, 33)",
      click: () => {
        send("mutesetting2");
        useMuteSettingNumber(2);
      },
    },
    {
      bgColor: "rgba(61, 255, 0, 23)",
      click: () => {
        send("mutesetting3");
        useMuteSettingNumber(3);
      },
    },
    {
      bgColor: "rgba(255, 255, 255, 123)",
      click: () => {
        send("mutesetting4");
        useMuteSettingNumber(4);
      },
      className: "text-black",
    },
  ];

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
      <section
        className="grid grid-rows-4 grid-cols-6 gap-1 w-[400px]"
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
          click={() => send("stop")}
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
              send("playpause"); // safe to toggle ON
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
          {overlayZones.map(
          ({ id, topPx, leftPx, widthPx, heightPx, onClick }) => {
            return (
              <div
                key={id}
                onClick={onClick}
                style={{
                  position: "absolute",
                  top: topPx,
                  left: leftPx,
                  width: widthPx,
                  height: heightPx,
                  cursor: "pointer",
                  backgroundColor: enableDebug ? "rgba(255,0,0,0.2)" : "transparent",
                }}
              />
            );
          }
        )}
      </div>

      <div className="flex gap-3 w-[460px] items-baseline">
        {muteSettingsButtons.map((mb, idx) => {
          return (
            <MuteSettingsButton
              key={idx}
              text={muteSetting[idx]}
              bgColor={mb.bgColor}
              click={mb.click}
              className={mb.className}
              styles={("styles" in mb && mb.styles) || {}}
            />
          );
        })}
        
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
