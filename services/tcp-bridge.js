const net = require('net');
const WebSocket = require('ws');

const PLAYER_IP = '192.168.1.37';
const AUDIO_PORT = 11000;
const IMAGE_PORT = 11002;
const WS_PORT = 3002;

const wss = new WebSocket.Server({ port: WS_PORT });
let audioClients = [];
let imageClients = [];

wss.on('connection', (ws, req) => {
  if (req.url === '/audio') audioClients.push(ws);
  else if (req.url === '/images') imageClients.push(ws);

  ws.on('close', () => {
    audioClients = audioClients.filter(c => c !== ws);
    imageClients = imageClients.filter(c => c !== ws);
  });
});

let lastAudioErrorTime = 0;
const AUDIO_ERROR_INTERVAL = 10000;

function connectToPlayer() {
  console.log(`Attempting to connect to SID player at ${PLAYER_IP}:${AUDIO_PORT}...`);

  const socket = net.connect(AUDIO_PORT, PLAYER_IP, () => {
    console.log('Connected to SID player audio stream');
  });

  let buffer = Buffer.alloc(0);

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const musicSize = buffer.readUInt32LE(0);
      if (musicSize < 1 || musicSize > 65536) {
        console.warn('Invalid musicSize:', musicSize);
        buffer = buffer.subarray(4);
        continue;
      }

      if (buffer.length < 4 + musicSize) break;

      const musicData = buffer.subarray(4, 4 + musicSize);
      buffer = buffer.subarray(4 + musicSize);

      audioClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(musicData);
      });
    }
  });

  socket.on('error', (err) => {
    const now = Date.now();
    if (err.code === 'ECONNREFUSED') {
      if (now - lastAudioErrorTime > AUDIO_ERROR_INTERVAL) {
        console.log('Idle ...');
        lastAudioErrorTime = now;
      }
    } else {
      console.error('Audio socket error:', err.message);
    }
    setTimeout(connectToPlayer, 1000);
  });

  socket.on('end', () => {
    console.log('SID player audio stream ended');
    setTimeout(connectToPlayer, 1000);
  });
}

let lastImageErrorTime = 0;
const IMAGE_ERROR_INTERVAL = 10000;

function connectToImageStream() {
  console.log(`Connecting to SID player image stream at ${PLAYER_IP}:${IMAGE_PORT}...`);
  const socket = net.connect(IMAGE_PORT, PLAYER_IP, () => {
    console.log('Connected to SID player image stream');
  });

  let buffer = Buffer.alloc(0);

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const imageSize = buffer.readUInt32LE(0);
      if (imageSize < 1 || imageSize > 2_000_000) {
        console.warn('Invalid imageSize:', imageSize);
        buffer = buffer.subarray(4);
        continue;
      }

      if (buffer.length < 4 + imageSize) break;

      const imageData = buffer.subarray(4, 4 + imageSize);
      buffer = buffer.subarray(4 + imageSize);

      const base64 = imageData.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      imageClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(dataUrl);
      });
    }
  });

  socket.on('error', err => {
    const now = Date.now();
    if (err.code === 'ECONNREFUSED') {
      if (now - lastImageErrorTime > IMAGE_ERROR_INTERVAL) {
        console.log('Idle ...');
        lastImageErrorTime = now;
      }
    } else {
      console.error('Image socket error:', err.message);
    }
    setTimeout(connectToImageStream, 1000);
  });

  socket.on('end', () => {
    console.log('SID player image stream ended');
    setTimeout(connectToImageStream, 1000);
  });
}

connectToPlayer();
connectToImageStream();