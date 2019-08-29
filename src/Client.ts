
import EventEmitter from "https://deno.land/x/event_emitter/mod.ts";
import { DispatchEvents } from "./types.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";
import { ClientOptions } from "./ClientOptions.ts";

interface ClientEvents {
  on(name: DispatchEvents, handler: (...data: any[]) => any): Client;
  addListener(name: DispatchEvents, handler: (...data: any[]) => any): Client;
}

class Client extends EventEmitter implements ClientEvents {
  private ws = new WebsocketShard(this.token, this);
  public options: ClientOptions;

  public constructor(private token = Deno.env().TOKEN || "", options?: ClientOptions) {
    super();
    this.options = {
      compress: false,
      ...(options || {})
    }
  }

  public connect(): Promise<void> {
    return this.ws.connect();
  }
}

export default Client;
