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



