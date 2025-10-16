import { clearSidCookie } from "@/app/utils";
import { RefObject } from "react";

export default function Debug({
  startAudio,
  stopAudio,
  startImages,
  stopImages,
  audioCtx,
  resetImages,
  resetAudio,
  send,
  audioNodeRef,
}: {
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  startImages: () => void;
  stopImages: () => void;
  audioCtx: RefObject<AudioContext | null>;
  resetImages: () => Promise<void>;
  resetAudio: () => Promise<void>;
  send: (msg: string) => void;
  audioNodeRef: RefObject<AudioWorkletNode | null>;
}) {
  return (
    <aside className="w-[460px]">
      <h1
        className="flex justify-center"
        style={{ fontSize: "24px", fontWeight: "bold", color: "#6750a4" }}
      >
        SID PlayerFP Remote debug
      </h1>
      <div className="flex justify-center">
        <div className="flex justify-between mb-[20px] mt-1 w-[300px]">
          <div className="flex flex-col space-y-2">
            <button onClick={startAudio}>Start Audio</button>
            <button onClick={stopAudio}>Stop Audio</button>
            <button onClick={startImages}>Start Images</button>
            <button onClick={stopImages}>Stop Images</button>
            <button onClick={() => audioCtx.current?.resume()}>
              Resume Audio
            </button>
          </div>
          <div className="flex flex-col space-y-2 items-end">
            <button onClick={resetImages}>Reset Images</button>
            <button onClick={resetAudio}>Reset Audio</button>
            <button onClick={() => send("replay")}>Send replay</button>
            <button
              onClick={() =>
                audioNodeRef.current?.port.postMessage({ type: "flush" })
              }
            >
              Flush buffer
            </button>
            <button onClick={() => clearSidCookie()}>Delete cookie</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
