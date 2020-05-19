import { bus } from "./lib/Client.ts";
import WebsocketShard from "./lib/ws/websocket_shard.ts";

export function onDebug(debugHandler: (msg: string) => void) {
  bus.on("debug", debugHandler);
}

export function onError(errorHandler: (error: Error) => void) {
  bus.on("error", errorHandler);
}

export const { login } = WebsocketShard.get();

export { config } from "./lib/Client.ts";
