import "https://deno.land/x/dotenv/load.ts";
import Client from "../src/Client.ts";
import { Gateway } from "../src/@types/dencord.ts";

const cl = new Client(undefined, {
  compressStream: true,
  intents: Gateway.GatewayIntents.GUILDS |
  Gateway.GatewayIntents.GUILD_MESSAGES
});

cl.on("READY", () => {
  console.log("Ready.");
});

cl.on("MESSAGE_CREATE", e => {
  console.log(e.author);
  console.log(e.content);
});

try {
  cl.connect();
} catch (err) {
  console.error(err);
}
