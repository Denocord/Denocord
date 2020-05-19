import WebsocketShard from "./lib/ws/websocket_shard.ts";

export const {
  on,
  once,
  off,
  emit,
  removeAllListeners,
  prependListener,
  prependOnceListener,
  listenerCount,
  setMaxListeners,
} = WebsocketShard.get();
