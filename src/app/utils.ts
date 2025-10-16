import { Dispatch, RefObject, SetStateAction } from "react";

export function getSettingsFromCookie() {
  if (typeof document === "undefined") {
    return { sidIp: "", yourIp: "", debugEnabled: false };
  }

  const cookies = Object.fromEntries(
    document.cookie.split("; ").map((c) => c.split("="))
  );
  return {
    sidIp: cookies.sidIp || "",
    yourIp: cookies.yourIp || "",
    debugEnabled: cookies.debugEnabled === "true",
  };
}

export const clearSidCookie = () =>
  ["sidIp", "yourIp", "debugEnabled"].forEach(
    (cookie) =>
      (document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`)
  );

export const burstClick = (
  e: React.MouseEvent<HTMLButtonElement>,
  callback?: () => void
) => {
  callback && callback();
  const button = e.currentTarget;
  const burstContainer = document.createElement("span");
  burstContainer.className = "relative inset-0 pointer-events-none";
  button.appendChild(burstContainer);

  const burstCount = 4;
  const delayStep = 125;

  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      const burst = document.createElement("span");
      burst.className =
        "absolute left-1/2 top-1/2 w-[40px] h-[20px] bg-black animate-burst";
      burst.style.transform = "translate(-50%, -50%)";
      burstContainer.appendChild(burst);

      setTimeout(() => burst.remove(), 600);
    }, i * delayStep);
  }
  setTimeout(() => burstContainer.remove(), burstCount * delayStep + 600);
};

export const validateIp = "^([0-9]{1,3}.){3}[0-9]{1,3}$";

export type handleOpenPropsTypes = {
  buttonRef: RefObject<HTMLButtonElement | null>;
  setModalPos: Dispatch<SetStateAction<{ top: number; left: number } | null>>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const handleOpen = ({
  buttonRef,
  setModalPos,
  setIsOpen,
}: handleOpenPropsTypes) => {
  const rect = buttonRef.current?.getBoundingClientRect();
  if (rect) {
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;
    setModalPos({ top: centerY, left: centerX });
    setIsOpen(true);
  }
};

export const sendIp = async (
  sidplayerIp: string | null,
  callback: (res: boolean) => void
) => {
  await fetch("http://localhost:3003/set-ip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip: sidplayerIp }),
  });
  callback(true);
};
