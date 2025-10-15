import { RefObject } from "react";

export async function setupAudioNode(
  ctx: AudioContext,
  nodeRef: RefObject<AudioWorkletNode | null>,
  socketRef: RefObject<WebSocket | null>,
  updateStatus: (status: {
    fillRatio: number;
    isPrimed: boolean;
    buffering: boolean;
  }) => void
) {
  await ctx.audioWorklet.addModule("/sid-processor.js");

  if (nodeRef.current) {
    nodeRef.current.disconnect();
    nodeRef.current = null;
  }

  const node = new AudioWorkletNode(ctx, "sid-processor", {
    outputChannelCount: [2],
  });
  node.connect(ctx.destination);
  nodeRef.current = node;

  if (socketRef.current) {
    socketRef.current.onmessage = null;
    socketRef.current.close();
    socketRef.current = null;
  }

  const socket = new WebSocket("ws://localhost:3002/audio");
  socket.binaryType = "arraybuffer";
  socketRef.current = socket;

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
    if (event.data.type === "status") {
      updateStatus(event.data);
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx.state === "suspended") {
      ctx.resume();
    }
  });
}

