import React, { useState } from "react";
import { MuteSettingsButton } from "./mute-settings-button";

type OverlayZone = {
  id: string;
  topPx: number;
  leftPx: number;
  widthPx: number;
  heightPx: number;
  onClick: () => void;
};

type MuteButton = {
  bgColor: string;
  click: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

type Props = {
  overlayZones: OverlayZone[];
  muteButtons: MuteButton[];
  debug: boolean;
};

export const OverlayControls: React.FC<Props> = ({
  overlayZones,
  muteButtons,
  debug
}) => {
  return (
    <>
      {/* Overlay Zones */}
      {overlayZones.map((zone) => (
        <div
          key={zone.id}
          onClick={zone.onClick}
          style={{
            position: "absolute",
            top: zone.topPx,
            left: zone.leftPx,
            width: zone.widthPx,
            height: zone.heightPx,
            cursor: "pointer",
            backgroundColor: debug ? "rgba(255,0,0,0.2)" : "transparent"
          }}
        />
      ))}

      {/* Mute Buttons */}
      <div className="flex gap-2 mt-4">
        {muteButtons.map((mb, idx) => (
          <MuteSettingsButton
              key={idx}
              bgColor={mb.bgColor}
              click={mb.click}
              className={mb.className}
              styles={("styles" in mb && mb.styles) || {}}
          >
          </MuteSettingsButton>
        ))}
      </div>
    </>
  );
};
