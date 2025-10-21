const net = require("net");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

// Config
const AUDIO_PORT = 11000;
const IMAGE_PORT = 11002;
const WS_PORT = 3002;
const CONTROL_PORT = 3003;

// State
let PLAYER_IP = null;
let audioSocket = null;
let imageSocket = null;
let audioClients = [];
let imageClients = [];
let lastAudioErrorTime = 0;
let lastImageErrorTime = 0;
const AUDIO_ERROR_INTERVAL = 10000;
const IMAGE_ERROR_INTERVAL = 10000;

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });
wss.on("connection", (ws, req) => {
  if (req.url === "/audio") audioClients.push(ws);
  else if (req.url === "/images") imageClients.push(ws);

  ws.on("close", () => {
    audioClients = audioClients.filter((c) => c !== ws);
    imageClients = imageClients.filter((c) => c !== ws);
  });
});

// Audio Stream
function connectToPlayer() {
  if (!PLAYER_IP) return console.log("Waiting for player IP...");
  if (audioSocket) return;

  console.log(
    `Attempting to connect to SID player at ${PLAYER_IP}:${AUDIO_PORT}...`
  );
  audioSocket = net.connect(AUDIO_PORT, PLAYER_IP, () => {
    console.log("Connected to SID player audio stream");
  });

  let buffer = Buffer.alloc(0);

  audioSocket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const musicSize = buffer.readUInt32LE(0);
      if (musicSize < 1 || musicSize > 65536) {
        console.warn("Invalid musicSize:", musicSize);
        buffer = buffer.subarray(4);
        continue;
      }

      if (buffer.length < 4 + musicSize) break;

      const musicData = buffer.subarray(4, 4 + musicSize);
      buffer = buffer.subarray(4 + musicSize);

      audioClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(musicData);
      });
    }
  });

  audioSocket.on("error", (err) => {
    audioSocket = null;
    const now = Date.now();
    if (
      err.code === "ECONNREFUSED" &&
      now - lastAudioErrorTime > AUDIO_ERROR_INTERVAL
    ) {
      console.log("Idle ...");
      lastAudioErrorTime = now;
    } else {
      console.error("Audio socket error:", err.message);
    }
    setTimeout(connectToPlayer, 500);
  });

  audioSocket.on("end", () => {
    console.log("SID player audio stream ended");
    audioSocket = null;
    setTimeout(connectToPlayer, 500);
  });
}

// Image Stream
function connectToImageStream() {
  if (!PLAYER_IP) return console.log("Waiting for player IP...");
  if (imageSocket) return;

  console.log(
    `Connecting to SID player image stream at ${PLAYER_IP}:${IMAGE_PORT}...`
  );
  imageSocket = net.connect(IMAGE_PORT, PLAYER_IP, () => {
    console.log("Connected to SID player image stream");
  });

  let buffer = Buffer.alloc(0);

  imageSocket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const imageSize = buffer.readUInt32LE(0);
      if (imageSize < 1 || imageSize > 2_000_000) {
        console.warn("Invalid imageSize:", imageSize);
        buffer = buffer.subarray(4);
        continue;
      }

      if (buffer.length < 4 + imageSize) break;

      const imageData = buffer.subarray(4, 4 + imageSize);
      buffer = buffer.subarray(4 + imageSize);

      const base64 = imageData.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      imageClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(dataUrl);
      });
    }
  });

  imageSocket.on("error", (err) => {
    imageSocket = null;
    const now = Date.now();
    if (
      err.code === "ECONNREFUSED" &&
      now - lastImageErrorTime > IMAGE_ERROR_INTERVAL
    ) {
      console.log("Idle ...");
      lastImageErrorTime = now;
    } else {
      console.error("Image socket error:", err.message);
    }
    setTimeout(connectToImageStream, 1000);
  });

  imageSocket.on("end", () => {
    console.log("SID player image stream ended");
    imageSocket = null;
    setTimeout(connectToImageStream, 1000);
  });
}

// Server to receive player IP
const app = express();
app.use(cors());
app.use(express.json());

app.post("/set-ip", (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).send("Missing IP");

  if (PLAYER_IP === ip) {
    return res.status(200).send(`Player IP already set to ${ip}`);
  }

  PLAYER_IP = ip;
  console.log(`Received player IP: ${ip}`);

  connectToPlayer();
  connectToImageStream();

  res.send(`Player IP set to ${ip}`);
});

app.post("/close-audio", (req, res) => {
  if (audioSocket) {
    audioSocket.destroy(); // forcefully closes the TCP connection
    audioSocket = null;
    console.log("Audio socket forcibly closed");
    return res.send("Audio socket closed");
  }
  res.send("No active audio socket");
});

app.post("/restart-audio", (req, res) => {
  if (audioSocket) {
    audioSocket.destroy();
    audioSocket = null;
  }
  connectToPlayer(); // reconnect
  console.log("Audio socket restarted");
  res.send("Audio socket restarted");
});

app.listen(CONTROL_PORT, () => {
  console.log(`Control API listening on port ${CONTROL_PORT}`);
});

