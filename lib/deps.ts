export { default as StrictEventEmitter } from "https://raw.githubusercontent.com/bterlson/strict-event-emitter-types/master/src/index.ts";
export { default as EventEmitter } from "https://deno.land/std@0.68.0/node/events.ts";
export {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent,
} from "https://deno.land/std@0.68.0/ws/mod.ts";
export { equal } from "https://deno.land/std@0.68.0/bytes/mod.ts";
export { inflate } from "https://deno.land/x/zlib.es@v1.0.0/mod.ts";
export { default as decompressor } from "https://raw.githubusercontent.com/Denocord/denoflate/6319461e7203631cc73abbefcb0306a14059f7ab/mod.ts";
//deno-fmt-ignore-line
//export { default as decompressor } from "../../denoflate/mod.ts";
export * as APITypes from "https://raw.githubusercontent.com/Denocord/discord-api-types/c6cbd8e15fa0afd5f3b50640fa5802822994c345/src/high_level.ts";
