//import "https://deno.land/x/dotenv/load.ts"; //broken in 1.0.0-rc3
import Client from "../src/Client.ts";
import { Gateway } from "../src/@types/denocord.ts";
import config from "./testConfig.ts";

const cl = new Client(config.token, {
  compressStream: true,
  intents:
    Gateway.GatewayIntents.GUILDS | Gateway.GatewayIntents.GUILD_MESSAGES,
});

const SeqBucket = new SequentialBucket();

/*(() => {
  SeqBucket.limit = 2;
  SeqBucket.reset = 10000;
  SeqBucket.remaining = 2;
  for (let i = 0; i < 5; i++) {
    SeqBucket.add(async () => {
      console.log("on");
      await new Promise(rs => setTimeout(rs, 1000));
      SeqBucket.remaining--;
      console.log("off");
    });
  }
})();*/

cl.on("READY", () => {
  console.log("Ready.");
});
let msgCount = 0;
cl.on("MESSAGE_CREATE", async e => {
  if (e.content === "deno!hello") {
    /*console.log(" ===== PRE ===== ");
    console.log(Object.entries((<any>cl.requestHandler).routeMapping));
    console.log((<any>cl.requestHandler).ratelimitBuckets.size);
    [...(<any>cl.requestHandler).ratelimitBuckets.entries()].forEach(([path, bucket]: [string, any]) => {
      console.log(path, bucket.limit, bucket.remaining, bucket.lastTime, bucket.resetOn);
    })
    console.log(" ===== PRE END ===== ");*/
    await cl.createMessage(e.channel_id, {
      content: "Hello there!"
    });
    console.log(Object.entries((<any>cl.requestHandler).routeMapping));
    [...(<any>cl.requestHandler).ratelimitBuckets.entries()].forEach(([path, bucket]: [string, any]) => {
      console.log(path, bucket.limit, bucket.remaining, bucket.lastTime, bucket.resetOn);
    })
  }
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
