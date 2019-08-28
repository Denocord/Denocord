import "https://deno.land/x/dotenv/load.ts";
import WebsocketShard from "../src/Gateway/WebsocketShard.ts";

const cl = new WebsocketShard();

try {
  cl.connect();
} catch (err) {
  console.error(err);
}
