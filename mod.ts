import { bus } from "./lib/client.ts";
import WebsocketShard from "./lib/ws/websocket_shard.ts";

export const VERSION = "0.0.1";

export function onDebug(debugHandler: (msg: string) => void) {
  bus.on("debug", debugHandler);
}

export function onError(errorHandler: (error: Error) => void) {
  bus.on("error", errorHandler);
}
const ws = WebsocketShard.get();
export const login = ws.login.bind(ws);

export { config } from "./lib/client.ts";