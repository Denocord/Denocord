export { default as StrictEventEmitter } from "https://raw.githubusercontent.com/bterlson/strict-event-emitter-types/master/src/index.ts";
export { default as EventEmitter } from "https://deno.land/std@v0.58.0/node/events.ts";
export {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent,
} from "https://deno.land/std@v0.58.0/ws/mod.ts";
export { equal } from "https://deno.land/std@v0.58.0/bytes/mod.ts";
export { default as pako } from "https://raw.githubusercontent.com/Denocord/pako/master/mod.js";
export { default as decompressor } from "https://raw.githubusercontent.com/Denocord/denoflate/e6979699a90b5e1aaf1022fc3b1391e3b2d0bcd9/mod.ts";

// Development versions of the libraries
//export { default as decompressor } from "../../denoflate/mod.ts";
//export { default as pako } from "../../pako/mod.js";
