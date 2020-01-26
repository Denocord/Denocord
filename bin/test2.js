import {
  connectWebSocket,
  isWebSocketCloseEvent
} from "https://deno.land/std/ws/mod.ts";

connectWebSocket("wss://gateway.discord.gg").then(async ws => {
  let seq = null;
  (async () => {
    for await (const payload of ws.receive()) {
      if (isWebSocketCloseEvent(payload)) {
        break;
      } else if (typeof payload === "string") {
        console.log(payload);
        const p = JSON.parse(payload);
        console.log(p);
        if (p.op === 10) {
          setInterval(
            () =>
              ws.send(
                JSON.stringify({
                  op: 1,
                  d: seq
                })
              ),
            p.d.heartbeat_interval
          );
          console.log("SENDING IDENT");
          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                token:
                  "NjE2NTU3NTI5MzkxOTU1OTY5.XWeUBQ.IYpNRBnZfSXiOD7ChmhoLzCBSgY",
                compress: false,
                properties: {
                  $os: "windex",
                  $browser: "lib",
                  $device: "lib"
                }
              }
            })
          );
          console.log("IDENT SENT");
        } else if (p.op === 11) {
          console.log("HB ACK");
        } else {
          console.log(p);
        }
      }
    }
  })();
});
