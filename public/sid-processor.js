import { RingBuffer } from './ring-buffer.js';

class SIDProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new RingBuffer(48000); // 1 second stereo
    this.frameCount = 0;
    this.playbackState = "buffering"; // initial state
    this.primingThreshold = 48000; // 1 second at 48kHz threshold

    this.port.onmessage = (event) => {
      const { type, left, right } = event.data;

      if (type === "flush") {
        this.buffer = new RingBuffer(48000);
        this.playbackState = "buffering";
        this.port.postMessage({ type: "debug", message: "Flush received" });
        return;
      }

      if (left && right) {
        this.buffer.push(left, right);
      }
    };
  }

  process(_, outputs) {

    const output = outputs[0];
    const leftOut = output[0];
    const rightOut = output[1];

    if (!leftOut || !rightOut) return true;

    // Check buffer state
    if (this.playbackState === "buffering") {
      if (this.buffer.available >= this.primingThreshold) {
        this.playbackState = "playing";
      } else {
        for (let i = 0; i < leftOut.length; i++) {
          leftOut[i] = 0;
          rightOut[i] = 0;
        }
        this.sendStatus();
        return true;
      }
    }

    // If buffer drops below 2048, re-enter buffering
    if (this.buffer.available < 2048) {
      this.playbackState = "buffering";
      for (let i = 0; i < leftOut.length; i++) {
        leftOut[i] = 0;
        rightOut[i] = 0;
      }
      this.sendStatus();
      return true;
    }

    // Normal playback
    this.buffer.pull(leftOut, rightOut);
    this.sendStatus();
    return true;
  }

  sendStatus() {
    if (++this.frameCount % 10 === 0) {
      this.port.postMessage({
        type: "status",
        fillRatio: this.buffer.fillRatio,
        isPrimed: this.playbackState === "playing",
        buffering: this.playbackState === "buffering",
      });
    }
  }
}

registerProcessor("sid-processor", SIDProcessor);
