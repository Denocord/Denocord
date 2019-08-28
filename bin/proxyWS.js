const { createServer } = require("http-proxy");

createServer({
  target: "wss://gateway.discord.gg/?v=6&encoding=json",
  ws: true,
  changeOrigin: true,
})
  .listen(8014);
