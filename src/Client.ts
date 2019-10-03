import EventEmitter from "https://deno.land/x/event_emitter/mod.ts";
import { Gateway } from "./@types/dencord.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";

interface Client {
  on(name: Gateway.DispatchEvents, handler: (...data: any[]) => void): this;
  addListener(
    name: Gateway.DispatchEvents,
    handler: (...data: any[]) => void
  ): this;
}

class Client extends EventEmitter {
  private ws = new WebsocketShard(this.token, this);

  // TODO(Z): This may have implications on boot times.
  public constructor(private token = Deno.env().TOKEN || "") {
    super();
  }

  public connect(): Promise<void> {
    return this.ws.connect();
  }
}

export default Client;
