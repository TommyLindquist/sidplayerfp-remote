import type { MouseEvent } from "react";

export type FormButtonPropsTypes = {
  text: string | number;
  id: string;
  click: (e: MouseEvent<HTMLInputElement>) => void;
  className?: string;
  name?: string;
  srValue?: string;
};

export function FormButton({
  text,
  id,
  click,
  className,
  name,
  srValue,
}: FormButtonPropsTypes) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {srValue ?? text}
      </label>
      <input
        type="button"
        name={name ?? id}
        id={id}
        defaultValue={text}
        onClick={(e) => click(e)}
        className={`px-4 py-2 rounded-4xl text-[0.8rem] m-1 cursor-pointer bg-black ${className}`}
      />
    </>
  );
}
