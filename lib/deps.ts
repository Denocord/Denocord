export type { default as StrictEventEmitter } from "https://raw.githubusercontent.com/bterlson/strict-event-emitter-types/master/src/index.ts";
export { default as EventEmitter } from "https://deno.land/std@0.77.0/node/events.ts";
export { equal } from "https://deno.land/std@0.77.0/bytes/mod.ts";
export { inflate } from "https://deno.land/x/zlib.es@v1.0.0/mod.ts";
export { default as decompressor } from "https://raw.githubusercontent.com/Denocord/denoflate/d252d766d90ff4b9d5dde6831367a051b343aaea/mod.ts";
//deno-fmt-ignore-line
//export { default as decompressor } from "../../denoflate/mod.ts";

// TODO: rewrite from discord-api-types-new to discord-api-types once main repo renamed
export * as APITypes from "https://raw.githubusercontent.com/Denocord/discord-api-types-new/06c171515ef9d1b0a4ff8cb6b096606b947a42c6/high_level.ts";
