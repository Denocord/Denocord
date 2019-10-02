
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

  public constructor(private token = Deno.env().TOKEN || "", options?: ClientOptions) {
    super();
    this.options = {
      compress: false,
      ...(options || {})
    }
  }

  public connect(): Promise<void> {
    // TODO: implement proper ratelimiting support
    const promise = this.gatewayURL ? 
      Promise.resolve(this.gatewayURL) : fetch(`${API_BASE}/gateway`)
      .then(r => r.json())
      .then(r => this.gatewayURL = r.url);
    return promise.then(() => {
      this.ws.connect();
      console.log(this.gatewayURL);
    });
  }
}

export default Client;
