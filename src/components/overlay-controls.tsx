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
  click: () => void;
  className?: string;
};

type Props = {
  overlayZones: OverlayZone[];
  muteButtons: MuteButton[];
  muteSetting: string[];
};

export const OverlayControls: React.FC<Props> = ({
  overlayZones,
  muteButtons,
  muteSetting
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
            backgroundColor: "rgba(255,255,255,0.01)", // invisible but clickable
          }}
        />
      ))}

      {/* Mute Buttons */}
      <div className="flex gap-2 mt-4">
        {muteButtons.map((mb, idx) => (
          <MuteSettingsButton
              key={idx}
              text={muteSetting[idx]}
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
