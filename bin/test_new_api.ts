import { config, login, onDebug, onError, state, APITypes } from "../mod.ts";
import { on, configure as wsConfigure, CompressionOptions } from "../ws.ts";
import rest, { create } from "../rest.ts";
import cfg from "./testConfig.ts";

config({ someOption: false });
wsConfigure({
  compress: CompressionOptions.ZLIB_STREAM,
});

onDebug((msg) => console.debug("[DEBUG]", msg));
onError(console.error);

on("ready", () => {
  console.log(
    `Logged in as ${state.user.username}#${state.user.discriminator}`,
  );
});

on("message", async (msg) => {
  //console.log(msg);
  console.log(msg.content);
  if (msg.content === "deno!hello") {
    const newMessage = await create(
      {
        id: msg.channel_id,
        [APITypes.DATA_SYMBOL]: APITypes.DataTypes.CHANNEL,
      },
      APITypes.DataTypes.MESSAGE,
      {
        content: "Hi there!",
        embed: {
          title: "This is an embed",
        },
        files: [
          new File([new TextEncoder().encode("hello!")], "text.txt", {
            type: "text/plain",
          }),
        ],
      },
    );
    console.log(newMessage.content);
  } else if (msg.content === "deno!send_dm") {
    console.log(msg.author);
    const channel = await create(msg.author, APITypes.DataTypes.CHANNEL);
    console.log(channel);
    const newMessage = await create(
      channel,
      APITypes.DataTypes.MESSAGE,
      {
        content: "Hi there!",
        embed: {
          title: "This is an embed",
        },
        files: [
          new File([new TextEncoder().encode("hello!")], "text.txt", {
            type: "text/plain",
          }),
        ],
      },
    );
    console.log(newMessage.content);
  }
  console.log(msg.content);
});

await login(cfg.token);
