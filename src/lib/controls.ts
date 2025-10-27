import { burstClick } from "@/app/utils";
import { RefObject } from "react";

export function getOverlayZones(
  send: (msg: string) => void,
  startImages: () => void,
  audioNodeRef: RefObject<AudioWorkletNode | null>,
  repeatChecked: RefObject<boolean>,
  playPause: (
    send: (msg: string) => void,
    callback: () => void
  ) => Promise<void>
) {
  return [
    {
      id: "display",
      topPx: 35,
      leftPx: 10,
      widthPx: 213,
      heightPx: 118,
      onClick: () => send("displayclick"),
    },
    {
      id: "play",
      topPx: 151,
      leftPx: 295,
      widthPx: 20,
      heightPx: 20,
      onClick: async () => await playPause(send, () => startImages()),
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
        }, 200);
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
        }, 200);
      },
    },
    {
      id: "repeat",
      topPx: 161,
      leftPx: 11,
      widthPx: 12,
      heightPx: 12,
      onClick: () => {
        repeatChecked.current = !repeatChecked.current;
        send(`repeat${repeatChecked.current ? "on" : "off"}`);
      },
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
    {
      id: "AdjustDisplay",
      topPx: 135,
      leftPx: 195,
      widthPx: 20,
      heightPx: 20,
      onClick: () => send("AdjustDisplay"),
    },
  ];
}

export function getMuteButtons(send: (msg: string) => void) {
  return [
    {
      bgColor: "rgba(158, 0, 255, 255)",
      click: (e: React.MouseEvent<HTMLButtonElement>) =>
        burstClick(e, () => send("mutesetting0")),
    },
    {
      bgColor: "rgba(255, 176, 0, 23)",
      click: (e: React.MouseEvent<HTMLButtonElement>) =>
        burstClick(e, () => send("mutesetting1")),
    },
    {
      bgColor: "rgba(211, 140, 53, 33)",
      click: (e: React.MouseEvent<HTMLButtonElement>) =>
        burstClick(e, () => send("mutesetting2")),
    },
    {
      bgColor: "rgba(61, 255, 0, 23)",
      click: (e: React.MouseEvent<HTMLButtonElement>) =>
        burstClick(e, () => send("mutesetting3")),
    },
    {
      bgColor: "rgba(255, 255, 255, 123)",
      click: (e: React.MouseEvent<HTMLButtonElement>) =>
        burstClick(e, () => send("mutesetting4")),
      className: "text-black",
    },
  ];
}
