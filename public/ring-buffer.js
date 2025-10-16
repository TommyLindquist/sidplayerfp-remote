export class RingBuffer {
  // Customized for 2-channels in stereo
  constructor(size) {
    this.size = size;
    this.left = new Float32Array(size);
    this.right = new Float32Array(size);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.available = 0;
  }

  push(leftChunk, rightChunk) {
    for (let i = 0; i < leftChunk.length; i++) {
      this.left[this.writeIndex] = leftChunk[i];
      this.right[this.writeIndex] = rightChunk[i];
      this.writeIndex = (this.writeIndex + 1) % this.size;
      if (this.available < this.size) this.available++;
      else this.readIndex = (this.readIndex + 1) % this.size;
    }
  }

  pull(outputLeft, outputRight) {
    for (let i = 0; i < outputLeft.length; i++) {
      if (this.available > 0) {
        outputLeft[i] = this.left[this.readIndex];
        outputRight[i] = this.right[this.readIndex];
        this.readIndex = (this.readIndex + 1) % this.size;
        this.available--;
      } else {
        outputLeft[i] = 0;
        outputRight[i] = 0;
      }
    }
  }
  // status of ringbuffer health
  get fillRatio() {
    return this.available / this.size;
  }

  get isPrimed() {
    return this.available >= 24000;
  }
}
