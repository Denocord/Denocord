import "https://deno.land/x/dotenv/load.ts";
import Client from "../src/Client.ts";
import { Gateway } from "../src/@types/denocord.ts";

const cl = new Client(undefined, {
  compressStream: true,
  intents: Gateway.GatewayIntents.GUILDS |
    Gateway.GatewayIntents.GUILD_MESSAGES
});

cl.on("READY", () => {
  console.log("Ready.");
});
let msgCount = 0;
cl.on("MESSAGE_CREATE", async e => {
  console.log(e.author);
  console.log(e.content);
  /*msgCount++;
  try {
    await cl.setActivity({
      game: {
        type: 0,
        name: `Seen ${msgCount} messages`
      },
      status: "online",
      afk: false,
      since: 0
    });
  } catch { }*/
});

try {
  cl.connect();
} catch (err) {
  console.error(err);
}