import WebsocketShard from "./lib/ws/WebsocketShard.ts";

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
