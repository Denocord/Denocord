import { config, login, onDebug, onError, state } from "../mod.ts";
import { on, configure as wsConfigure, CompressionOptions } from "../ws.ts";
import rest from "../rest.ts";
import cfg from "./testConfig.ts";

config({ someOption: false });
wsConfigure({
  compress: CompressionOptions.ZLIB_STREAM
})

onDebug(console.debug);
onError(console.error);

on("ready", () => {
  console.log(`Logged in as ${state.user.username}#${state.user.discriminator}`);
  console.log(state.guilds.get("616556458946854922").guild_hashes);
});

on("MESSAGE_CREATE", async msg => {
  //console.log(msg);
  type msgContent = {
    content: string;
    channel_id: string;
  };
  const data = <msgContent>msg;
  if (data.content === "deno!hello") {
    /*await rest.request("POST", `/channels/${data.channel_id}/messages`, true, {
      content: "Hi!"
    });*/
  }
});

await login(cfg.token);
