import { CustomButton } from "@/components/custom-button";
import { RefObject } from "react";

export type propsTypes = {
  send: (msg: string) => void;
  audioNodeRef: RefObject<AudioWorkletNode | null>;
  startImages: () => void;
  repeatChecked: RefObject<boolean>;
  playPause: (
    send: (msg: string) => void,
    callback: () => void
  ) => Promise<void>;
};

export default function LayoutPlayerButtons({
  send,
  audioNodeRef,
  startImages,
  repeatChecked,
  playPause,
}: propsTypes) {
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
        click={async () => await playPause(send, () => startImages())}
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
