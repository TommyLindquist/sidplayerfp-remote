export type propsTypes = {
  bufferFill: number;
  isBuffering: boolean;
  isPrimed: boolean;
};

export default function BufferIndicator({
  bufferFill,
  isBuffering,
  isPrimed,
}: propsTypes) {
  return (
    <div className="mt-[20px] w-[460px]">
      <label>Buffer Fill:</label>
      <div className="w-full h-2.5 mt-1 relative bg-gray-300">
        <div
          className="h-full"
          style={{
            width: `${(bufferFill * 100).toFixed(1)}%`,
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
  );
}
