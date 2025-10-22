"use client";
import { useEffect, useState } from "react";
import {
  getSettingsFromCookie,
  hasSettingsChanged,
  validateIp,
} from "../utils";
import { FormButton } from "@/components/form-button";

export type FormSettingsPropsTypes = {
  position: { top: number; left: number };
  closeForm: () => void;
  restartScreen: () => void;
  restartAudio: () => void;
};

export default function FormSettings({
  position,
  closeForm,
  restartScreen,
  restartAudio,
}: FormSettingsPropsTypes) {
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
        top: position.top * 0.88,
        left: position.left,
        transform: "translate(-50%, -50%)",
      }}
      className="bg-gray-400/88 absolute z-1000 p-2"
    >
      <form
        className="grid gap-2 bg-purple-950/40 m-2 p-5 border-1 border-black/20"
        onSubmit={(e) => {
          e.preventDefault();
          closeForm();
          if (hasSettingsChanged({ ip, yourIp, enableDebug })) {
            document.cookie = `sidIp=${ip.trim()}; path=/`;
            document.cookie = `yourIp=${yourIp.trim()}; path=/`;
            document.cookie = `debugEnabled=${enableDebug}; path=/`;
            window.location.reload();
          }
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
          required
          pattern={validateIp}
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
          required
          pattern={validateIp}
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
          <label htmlFor="submit" className="sr-only">
            OK to submit changes
          </label>
          <input
            type="submit"
            defaultValue="OK"
            id="submit"
            name="submit"
            className="justify-self-start cursor-pointer"
          />
          <label htmlFor="cancel" className="sr-only">
            Cancel changing settings
          </label>
          <input
            type="button"
            className="ml-auto cursor-pointer"
            name="cancel"
            id="cancel"
            defaultValue="Cancel"
            onClick={closeForm}
          />
        </div>
        <div className="h-[110px]">
          <div className="bg-black/50 absolute left-[-7] bottom-[-9] m-6 p-2 py-4 w-[252px]">
            <FormButton
              text="Restart screen connection"
              id="restartScreenConnection"
              click={(e) => restartScreen()}
              className="mx-7 mb-3 bg-black/70!"
            />
            <FormButton
              text="Restart audio connection"
              id="restartAudioConnection"
              click={(e) => restartAudio()}
              className="mx-7 bg-black/70!"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
