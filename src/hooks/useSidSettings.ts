"use client";
import { getSettingsFromCookie } from "@/app/utils";
import { useEffect, useState } from "react";

export function useSidSettings() {
  const [sidplayerIp, setSidplayerIp] = useState<string | null>(null);
  const [yourIp, setYourIp] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const { sidIp, yourIp, debugEnabled } = getSettingsFromCookie();
    setSidplayerIp(sidIp || null);
    setYourIp(yourIp || null);
    setDebugEnabled(debugEnabled);
  }, []);

  return { sidplayerIp, yourIp, debugEnabled };
}