import WebsocketShard from "./Gateway/WebsocketShard.ts";

const cl = new WebsocketShard();

try {
  cl.connect();
} catch (err) {
  console.error(err);
}
