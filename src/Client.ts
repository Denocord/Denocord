
import EventEmitter from "https://deno.land/x/event_emitter/mod.ts";
import { DispatchEvents } from "./types.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";
import { ClientOptions } from "./ClientOptions.ts";
import { API_BASE } from "./lib/constants.ts";

interface ClientEvents {
  on(name: DispatchEvents, handler: (...data: any[]) => any): Client;
  addListener(name: DispatchEvents, handler: (...data: any[]) => any): Client;
}

class Client extends EventEmitter implements ClientEvents {
  private ws = new WebsocketShard(this.token, this);
  public gatewayURL: string = "";
  public options: ClientOptions;

  // TODO(Z): This may have implications on boot times.
  public constructor(private token = Deno.env().TOKEN || "", options?: ClientOptions) {
    super();
    this.options = {
      compress: false,
      ...(options || {})
    }
  }

  public async connect(): Promise<void> {
    // TODO: implement proper ratelimiting support

    if (!this.gatewayURL) {
      const { url } = await fetch(`${API_BASE}/gateway`)
      .then(r => r.json());

      this.gatewayURL = url;
    }
    return this.ws.connect();
  }
}

export default Client;
