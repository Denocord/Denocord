/**
 * Deprecate in favor of Deno.dialTLS
 * @deprecated
 */

const { createServer } = require("http-proxy");

const target = "wss://gateway.discord.gg/?v=6&encoding=json";
console.log(target);
createServer({
  target,
  ws: true,
  changeOrigin: true
}).listen(8014);
