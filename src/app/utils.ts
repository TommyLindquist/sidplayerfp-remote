export function getSettingsFromCookie() {
      if (typeof document === 'undefined') {
    return { sidIp: '', debugEnabled: false };
  }

  const cookies = Object.fromEntries(
    document.cookie.split("; ").map((c) => c.split("="))
  );
  return {
    sidIp: cookies.sidIp || "",
    debugEnabled: cookies.debugEnabled === "true",
  };
}

export function clearSidCookie() {
  document.cookie = "sidIp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "debugEnabled=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
