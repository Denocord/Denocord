export { default as StrictEventEmitter } from "https://raw.githubusercontent.com/bterlson/strict-event-emitter-types/master/src/index.ts";
export { default as EventEmitter } from "https://deno.land/std@0.66.0/node/events.ts";
export {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent,
} from "https://deno.land/std@0.66.0/ws/mod.ts";
export { equal } from "https://deno.land/std@0.66.0/bytes/mod.ts";
export { default as pako } from "https://raw.githubusercontent.com/Denocord/pako/master/mod.js";
export { default as decompressor } from "https://raw.githubusercontent.com/Denocord/denoflate/e2c3812d8410abc1f2c0b200e5e89f42ee1e907e/mod.ts";
//deno-fmt-ignore-line
//export { default as decompressor } from "../../denoflate/mod.ts";
export * as APITypes from "https://raw.githubusercontent.com/Denocord/discord-api-types/c5f9129ae8bb8ec7f3b3f1ec8edce8bb5887f1a4/src/high_level.ts";

