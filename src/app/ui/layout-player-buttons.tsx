import { CustomButton } from "@/components/custom-button";
import { RefObject } from "react";

export default function LayoutPlayerButtons({
    send,
    audioNodeRef,
    resetAudio,
    sendUDPCommand,
    audioCtx,
    audioSocketRef,
    sidplayerIp,
    startImages,
    repeatChecked,
}:{
    send: (msg: string) => void;
    audioNodeRef: RefObject<AudioWorkletNode | null>;
    resetAudio: () => Promise<void>;
    sendUDPCommand: (cmd: string, targetIP: string | null) => void;
    audioCtx: RefObject<AudioContext | null>;
    audioSocketRef: RefObject<WebSocket | null>
    sidplayerIp: string | null;
    startImages: () => void;
    repeatChecked: RefObject<boolean>;
}) {
  return (
    <>
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
    </>
  );
}
