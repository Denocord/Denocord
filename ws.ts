import WebsocketShard from "./lib/ws/websocket_shard.ts";
const ws = WebsocketShard.get();
export const on = ws.on.bind(ws);
export const once = ws.once.bind(ws);
export const off = ws.off.bind(ws);
export const emit = ws.emit.bind(ws);
export const removeAllListeners = ws.removeAllListeners.bind(ws);
export const prependListener = ws.prependListener.bind(ws);
export const prependOnceListener = ws.prependOnceListener.bind(ws);
export const listenerCount = ws.listenerCount.bind(ws);
export const setMaxListeners = ws.setMaxListeners.bind(ws);
export const configure = ws.configure.bind(ws);
export { CompressionOptions, WSOptions } from "./lib/ws/websocket_shard.ts";
