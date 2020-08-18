import { config, login, onDebug, onError, state, APITypes } from "../mod.ts";
import { on, configure as wsConfigure, CompressionOptions } from "../ws.ts";
import rest, { create } from "../rest.ts";
import cfg from "./testConfig.ts";
import diff, { DiffType } from "https://deno.land/std@0.65.0/testing/diff.ts";

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
  /*console.log(Array.from(state.guilds.values()).map(g => {
    if (!g.unavailable) return g.roles;
  }))*/
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

on("guildCreate", (g) => {
  console.log(`Welcome me to ${g.name}!`);
});

on("guildDelete", (g) => {
  const guild = <APITypes.Guild> g;
  if (typeof (<APITypes.Guild> g).name !== "undefined") {
    console.log(`I was removed from ${guild.name} (${guild.id})`);
  } else {
    console.log(`I was removed from an unknown guild (${g.id})`);
  }
});

on("guildUpdate", (newData, old) => {
  if (old) {
    const inspectedNew = Deno.inspect(newData).split("\n");
    const inspectedOld = Deno.inspect(old).split("\n");

    const difference = diff(inspectedOld, inspectedNew);

    const differenceArray = difference.map((diffItem) => {
      if (diffItem.type === DiffType.common) return `  ${diffItem.value}`;
      if (diffItem.type === DiffType.added) return `+ ${diffItem.value}`;
      if (diffItem.type === DiffType.removed) return `- ${diffItem.value}`;
    });
    console.log(differenceArray.join("\n"));
  }
});

await login(cfg.token);
