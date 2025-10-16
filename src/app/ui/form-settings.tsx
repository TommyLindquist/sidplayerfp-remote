"use client";
import { useEffect, useState } from "react";
import { getSettingsFromCookie } from "../utils";

export default function FormSettings({
  position,
  closeForm,
}: {
  position: { top: number; left: number };
  closeForm: () => void;
}) {
  const [ip, setIp] = useState("");
  const [yourIp, setYourIp] = useState("");
  const [enableDebug, setEnableDebug] = useState(false);

  useEffect(() => {
    const { sidIp, yourIp, debugEnabled } = getSettingsFromCookie();
    setIp(sidIp ?? "");
    setYourIp(yourIp ?? "");
    setEnableDebug(debugEnabled ?? false);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: position.top * 0.88,
        left: position.left,
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        padding: "1rem",
      }}
      className="bg-green-400/88"
    >
      <form
        className="grid gap-2 bg-purple-950/40 m-2 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          document.cookie = `sidIp=${ip.trim()}; path=/`;
          document.cookie = `yourIp=${yourIp.trim()}; path=/`;
          document.cookie = `debugEnabled=${enableDebug}; path=/`;
          closeForm();
          window.location.reload();
        }}
      >
        <label htmlFor="ipaddress">Enter IP address to player:</label>
        <input
          type="text"
          id="ipaddress"
          name="ipaddress"
          autoComplete="off"
          placeholder="IP Address"
          value={ip}
          className="border p-2"
          onChange={(e) => setIp(e.target.value)}
        />
       <label htmlFor="yourIpaddress">Enter your public IP address:</label>
        <input
          type="text"
          id="yourIpaddress"
          name="yourIpaddress"
          autoComplete="off"
          placeholder="IP Address"
          value={yourIp}
          className="border p-2"
          onChange={(e) => setYourIp(e.target.value)}
        />
        <div className="flex gap-2">
          <label htmlFor="enableDebug">Enable debug:</label>
          <input
            type="checkbox"
            id="enableDebug"
            name="enableDebug"
            checked={enableDebug === true}
            className="self-center"
            onChange={(e) => setEnableDebug(e.target.checked)}
          />
        </div>
        <div className="flex gap-2 flex-nowrap">
        <button type="submit" className="justify-self-start cursor-pointer">
          OK
        </button>
        <button type="button" className="ml-auto cursor-pointer" onClick={closeForm}>
          Cancel
        </button>
        </div>
      </form>
    </div>
  );
}
