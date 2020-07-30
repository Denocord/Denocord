export { default as StrictEventEmitter } from "https://raw.githubusercontent.com/bterlson/strict-event-emitter-types/master/src/index.ts";
export { default as EventEmitter } from "https://deno.land/std@v0.62.0/node/events.ts";
export {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent,
} from "https://deno.land/std@v0.62.0/ws/mod.ts";
export { equal } from "https://deno.land/std@v0.62.0/bytes/mod.ts";
export { default as pako } from "https://raw.githubusercontent.com/Denocord/pako/master/mod.js";
export { default as decompressor } from "https://raw.githubusercontent.com/Denocord/denoflate/3cb89c23c4cbd6b2609113749d58248c8921537a/mod.ts";
export * as APITypes from "https://raw.githubusercontent.com/Denocord/discord-api-types/master/src/high_level.ts";


// Development versions of the libraries
//export { default as decompressor } from "../../denoflate/mod.ts";
//export { default as pako } from "../../pako/mod.js";
//export * as APITypes from "../../discord-api-types/src/high_level.ts";