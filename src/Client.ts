import EventEmitter from "https://deno.land/x/event_emitter/mod.ts";
import { Gateway } from "./@types/dencord.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";
import { ClientOptions } from "./ClientOptions.ts";
import { API_BASE } from "./lib/constants.ts";

interface Client {
  on(name: Gateway.DispatchEvents, handler: (...data: any[]) => void): this;
  addListener(
    name: Gateway.DispatchEvents,
    handler: (...data: any[]) => void
  ): this;
}

class Client extends EventEmitter {
  private ws = new WebsocketShard(this.token, this);
  public gatewayURL: string = "";
  public options: ClientOptions;

  // TODO(Z): This may have implications on boot times.
  public constructor(
    private token = Deno.env().TOKEN || "",
    options?: ClientOptions
  ) {
    super();
    this.options = {
      compress: false,
      ...(options || {})
    };
  }

  public async connect(): Promise<void> {
    // TODO: implement proper ratelimiting support

    if (!this.gatewayURL) {
      const { url } = await fetch(`${API_BASE}/gateway`).then(r => r.json());
      this.gatewayURL = `${url}?v=6&encoding=json${this.options.compressStream ? `&compress=zlib-stream` : ""}`;
    }
    return this.ws.connect();
  }
}

export default Client;
