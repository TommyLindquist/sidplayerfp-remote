export function sendUDPCommand(cmd: string, targetIP: string | null) {
  if (!targetIP) return;
  fetch("http://localhost:3001/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: cmd, targetIP }),
  });
}
