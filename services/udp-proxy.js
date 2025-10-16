const dgram = require("dgram");
const express = require("express");
const cors = require("cors");

const app = express();
const udp = dgram.createSocket("udp4");

app.use(cors());
app.use(express.json());

app.post("/send", (req, res) => {
  const { message, targetIP } = req.body;
  const targetPort = 11001; // SID player control port

  if (!message || !targetIP) {
    return res.status(400).send("Missing message or targetIP");
  }

  const buf = Buffer.from(message, "ascii"); // match Android's encoding
  udp.send(buf, 0, buf.length, targetPort, targetIP, (err) => {
    if (err) {
      console.error("UDP send failed:", err);
      return res.status(500).send("UDP send failed");
    }
    console.log(`Sent to ${targetIP}:`, message);
    res.send("Sent");
  });
});

app.listen(3001, () => console.log("UDP proxy listening on port 3001"));
