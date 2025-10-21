# 🎧 SidplayerFp Remote

SidplayerFp Remote is a modular control and streaming system for SID-based audio playback. It bridges modern web interfaces with legacy SID player hardware or emulators using a combination of HTTP, UDP, TCP, and WebSocket protocols. Designed for orchestration, diagnostics, and real-time control, it enables seamless interaction with audio and image streams from SidplayerFp.

---
🧠 Features
- 🎚️ Real-time audio control (play/pause, gain, mute, repeat)
- 🖼️ Live image stream with overlay zones
- 🧠 Buffer diagnostics and priming indicators
- 🧪 Debug panel with manual stream controls
- 🧱 Modular architecture for orchestration and extensibility

🛠️ Technologies
- Node.js (express, dgram, net, ws)
- Next.js + React + Tailwind CSS
- WebSocket for real-time streaming
- UDP for command dispatch
- AudioWorklet for low latency playback in it's own thread

## 🧩 Project Structure

This system consists of these main components:

### 1. `tcp-bridge.js` — Audio & Image Stream Relay

- Connects to the SID player via TCP (`AUDIO_PORT`, `IMAGE_PORT`)
- Relays audio and image data to WebSocket clients (`/audio`, `/images`)
- Handles stream buffering, error recovery, and reconnection logic
- Accepts player IP via HTTP POST (`/set-ip`) on `CONTROL_PORT`

### 2. `udp-proxy.js` — Command Dispatcher

- Converts HTTP POST requests into UDP messages
- Sends control commands (e.g. `playpause`, `gainraise`) to SID player on port `11001`
- Runs on port `3001`

### 3. `sid-processor.js` — AudioWorklet for SID Playback

This file defines the SIDProcessor, a custom AudioWorkletProcessor that handles real-time stereo audio playback using a ring buffer.
🔧 Key Features
- Uses a RingBuffer to manage stereo PCM samples
- Starts in "buffering" mode until enough data is available
- Switches to "playing" once primed with 48,000 frames (1 second at 48kHz)
- Re-enters "buffering" if available frames drop below 2048
- Sends status updates (fillRatio, isPrimed, buffering) to the main thread every 10 frames
- Supports flush messages to reset buffer stat


### 4. `page.tsx` — Frontend Control Panel (Next.js)

- Sends player IP to `tcp-bridge.js`
- Initializes audio and image streams via custom hooks
- Provides playback controls, gain/mute toggles, and repeat settings
- Displays live image stream with overlay zones and buffer indicators
- Includes a modal-based settings form and debug panel
- Store IP Adresses in cookie for persistence among sessions

```
¦   
+---public
¦       ring-buffer.js
¦       sid-processor.js
¦       
+---services
¦       tcp-bridge.js
¦       udp-proxy.js
¦       
+---src
    +---app
    ¦   ¦   page.tsx
    ¦   ¦   utils.ts
    ¦   ¦   
    ¦   +---ui
    ¦           form-settings.tsx
    ¦           layout-player-buttons.tsx
    ¦           modal.tsx
    ¦           
    +---components
    ¦       buffer-indicator.tsx
    ¦       custom-button.tsx
    ¦       debug.tsx
    ¦       mute-settings-button.tsx
    ¦       overlay-controls.tsx
    ¦       
    +---hooks
    ¦       useAudioPlayer.ts
    ¦       useImageStream.ts
    ¦       useSidCommands.ts
    ¦       useSidSettings.ts
    ¦       
    +---lib
            audio.ts
            controls.ts
            image.ts
            udp.ts
```

---

## 🚀 Getting Started

### Setup

```bash
npm install

## Run

npm run start

## Ensure your SidplayerFp is reachable on the local network and 
## listening on ports 11000, 11001, and 11002.
```
---
📜 License
MIT
