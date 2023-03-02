const WebSocket = require("ws");
console.log(process.argv);
const PORT = process.env["PORT"] || 8080;
const sockserver = new WebSocket.Server({ port: PORT }, () => {
  console.log(`Websocket starter on port ${PORT}`);
});

sockserver.binaryType = "arraybuffer";

sockserver.on("connection", (ws) => {
  console.log("Client connected");
  ws.onmessage = ({ data }) => {
    sockserver.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log(data);
        client.send(data);
      }
    });
  };
  ws.on("close", () => console.log("Client has disconnected!"));
});

sockserver.on("error", console.error);
