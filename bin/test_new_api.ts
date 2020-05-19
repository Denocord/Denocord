import { config, login, onDebug, onError } from "../mod.ts";
import { on } from "../ws.ts";

config({ someOption: false });

onDebug(console.debug);
onError(console.error);

on("message", msg => {
  console.log(msg);
});

await login("A_TOKEN");
