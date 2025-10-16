export type propsTypes = {
  text: string | number;
  click: (event: React.MouseEvent<HTMLButtonElement>) => void;
  styles?: React.CSSProperties;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
};

export function CustomButton({
  text,
  click,
  styles,
  className,
  ref,
}: propsTypes) {
  return (
    <button
      className={`px-4 py-2 rounded-4xl text-[0.8rem] m-1 cursor-pointer ${className}`}
      onClick={(e) => click(e)}
      style={{ backgroundColor: "#6750a4", ...styles }}
      ref={ref}
    >
      {text}
    </button>
  );
}
