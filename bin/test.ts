import "https://deno.land/x/dotenv/load.ts";
import Client from "../src/Client.ts";

const cl = new Client(undefined, {
  compress: true
});

cl.on("READY", () => {
  console.log("Ready.");
})

cl.on("MESSAGE_CREATE", (e: any) => {
  console.log(e);
  console.log(e.content);
})

try {
  cl.connect();
} catch (err) {
  console.error(err);
}
