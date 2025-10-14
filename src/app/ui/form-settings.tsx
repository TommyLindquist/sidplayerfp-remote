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
  const [enableDebug, setEnableDebug] = useState(false);

  useEffect(() => {
    const { sidIp, debugEnabled } = getSettingsFromCookie();
    setIp(sidIp ?? "");
    setEnableDebug(debugEnabled ?? false);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        padding: "1rem",
      }}
      className="bg-black/90"
    >
      <form
        className="grid gap-2 bg-purple-950/40 m-2 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          document.cookie = `sidIp=${ip}; path=/`;
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
