import { config, login, onDebug, onError } from "../mod.ts";
import { on } from "../ws.ts";

config({ someOption: false });

onDebug(console.debug);
onError(console.error);

on("message", msg => {
  console.log(msg);
});

login("A_TOKEN");
