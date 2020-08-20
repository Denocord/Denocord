export { default as StrictEventEmitter } from "https://raw.githubusercontent.com/bterlson/strict-event-emitter-types/master/src/index.ts";
export { default as EventEmitter } from "https://deno.land/std@v0.65.0/node/events.ts";
export {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent,
} from "https://deno.land/std@v0.65.0/ws/mod.ts";
export { equal } from "https://deno.land/std@v0.65.0/bytes/mod.ts";
export { default as pako } from "https://raw.githubusercontent.com/Denocord/pako/master/mod.js";
export { default as decompressor } from "https://raw.githubusercontent.com/Denocord/denoflate/7b8c03e4b34517860a106a515c3c9565cf8743f3/mod.ts";
//deno-fmt-ignore-line
//export { default as decompressor } from "../../denoflate/mod.ts";
export * as APITypes from "https://raw.githubusercontent.com/Denocord/discord-api-types/05f0a60d20ab769cb8139beddf131d269fbda046/src/high_level.ts";
