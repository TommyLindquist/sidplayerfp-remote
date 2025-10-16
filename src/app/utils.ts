export function getSettingsFromCookie() {
      if (typeof document === 'undefined') {
    return { sidIp: '', yourIp: '', debugEnabled: false };
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
  ["sidIp", "yourIp", "debugEnabled"].forEach((cookie) => document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`);

 export const burstClick = (e: React.MouseEvent<HTMLButtonElement>, callback?: () => void) => {
    callback && callback();
    const button = e.currentTarget;
    const burstContainer = document.createElement('span');
    burstContainer.className = 'relative inset-0 pointer-events-none';
    button.appendChild(burstContainer);

    const burstCount = 4;
    const delayStep = 125;

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        const burst = document.createElement('span');
        burst.className =
          'absolute left-1/2 top-1/2 w-[40px] h-[20px] bg-black animate-burst';
        burst.style.transform = 'translate(-50%, -50%)';
        burstContainer.appendChild(burst);

        setTimeout(() => burst.remove(), 600);
      }, i * delayStep);
    }
    setTimeout(() => burstContainer.remove(), burstCount * delayStep + 600);
  };

