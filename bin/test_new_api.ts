import { APITypes, config, login, onDebug, onError, state } from "../mod.ts";
import { CompressionOptions, configure as wsConfigure, on } from "../ws.ts";
import rest, { create, get, remove, ROOT_SYMBOL } from "../rest.ts";
import cfg from "./testConfig.ts";
import { diff, DiffType } from "https://deno.land/std@0.75.0/testing/_diff.ts";
// Strip ANSI from eval
import { stripColor } from "https://deno.land/std@0.75.0/fmt/colors.ts";

config({ someOption: false });
wsConfigure({
  compress: CompressionOptions.ZLIB_STREAM,
  intents: APITypes.GatewayIntentBits.GUILD_MESSAGES |
    APITypes.GatewayIntentBits.GUILDS,
});

onDebug((msg) => console.debug("[DEBUG]", msg));
onError(console.error);

on("ready", () => {
  console.log(
    `Logged in as ${state.user.username}#${state.user.discriminator}`,
  );
  console.log(
    Array.from(state.guilds.values()).map((g) => {
      if (!g.unavailable) console.log(g.name, g.id);
    }),
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
  } else if (
    msg.content === "deno!create_server" &&
    msg.author.id === "150628341316059136"
  ) {
    const newGuild = await create(ROOT_SYMBOL, APITypes.DataTypes.GUILD, {
      name: "My cool server",
    });

    console.log(newGuild);
    //DataTypes.INVITE not a thing yet
    const channelList = await get(newGuild, APITypes.DataTypes.CHANNEL);
    const channel = channelList.find((c) => c.type === 0);
    if (!channel) {
      return console.log("Cannot find the proper channel for invite");
    }

    const invite: APITypes.Invite = await create({
      id: channel.id,
      [APITypes.DATA_SYMBOL]: APITypes.DataTypes.CHANNEL,
    }, APITypes.DataTypes.INVITE);
    console.log(invite[APITypes.DATA_SYMBOL]);
    const dm = await create(msg.author, APITypes.DataTypes.CHANNEL);
    await create(dm, APITypes.DataTypes.MESSAGE, {
      content: `Here's your invite: https://discord.gg/${invite.code}`,
    });
  } else if (
    msg.content.startsWith("deno!remove_messages ") &&
    msg.author.id === "150628341316059136"
  ) {
    const [, ...messagesToDelete] = msg.content.split(" ");
    await remove.messages(
      {
        id: msg.channel_id,
        [APITypes.DATA_SYMBOL]: APITypes.DataTypes.CHANNEL,
      },
      messagesToDelete,
      "Because I can",
    );
    await create(
      {
        id: msg.channel_id,
        [APITypes.DATA_SYMBOL]: APITypes.DataTypes.CHANNEL,
      },
      APITypes.DataTypes.MESSAGE,
      {
        content: "Deleted the messages you specified.",
      },
    );
  } else if (
    msg.content.startsWith("deno!eval ") &&
    msg.author.id === "150628341316059136"
  ) {
    const [, ...code] = msg.content.split(" ");
    const AsyncFunction = (async () => {}).constructor as FunctionConstructor;
    let output: unknown;
    try {
      output = await (new AsyncFunction(
        "msg",
        "create",
        "get",
        "remove",
        "ROOT_SYMBOL",
        "APITypes",
        code.join(" "),
      ))(msg, create, get, remove, ROOT_SYMBOL, APITypes);
    } catch (err) {
      output = err;
    }
    const insp = Deno.inspect(output);
    const codeBlock = `\`\`\`js\n${insp}\n\`\`\``;

    if (codeBlock.length > 2048) {
      console.log(output);
      await create(
        {
          id: msg.channel_id,
          [APITypes.DATA_SYMBOL]: APITypes.DataTypes.CHANNEL,
        },
        APITypes.DataTypes.MESSAGE,
        {
          content: "Check your console for eval output.",
        },
      );
      return;
    }
    await create(
      {
        id: msg.channel_id,
        [APITypes.DATA_SYMBOL]: APITypes.DataTypes.CHANNEL,
      },
      APITypes.DataTypes.MESSAGE,
      {
        embed: {
          title: "✅ Evaluated!",
          color: 0x008800,
          description: codeBlock,
        },
      },
    );
  }
});

on("guildCreate", (g) => {
  console.log(`Welcome me to ${g.name} (${g.id})!`);
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
    console.log(newData.name || old.name, "has updated");
    console.log("Old:");
    console.log(old);
    console.log("New:");
    console.log(newData);
    /*const inspectedNew = Deno.inspect(newData).split("\n");
    const inspectedOld = Deno.inspect(old).split("\n");*/

    /*const difference = diff(inspectedOld, inspectedNew);

    const differenceArray = difference.map((diffItem) => {
      if (diffItem.type === DiffType.common) return `  ${diffItem.value}`;
      if (diffItem.type === DiffType.added) return `+ ${diffItem.value}`;
      if (diffItem.type === DiffType.removed) return `- ${diffItem.value}`;
    });
    console.log(differenceArray.join("\n"));*/
  }
});

await login(cfg.token);
