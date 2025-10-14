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

    this.playbackState = "playing";

    // Normal playback
    this.buffer.pull(leftOut, rightOut);
    this.sendStatus();
    return true;
  }
  sendStatus() {
    if (++this.frameCount % 10 === 0) {
      this.port.postMessage({
        type: "status",
        fillRatio: this.buffer.fillRatio
      });
    }
  }
}

registerProcessor("sid-processor", SIDProcessor);