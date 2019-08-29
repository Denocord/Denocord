import EventEmitter from "https://deno.land/x/event_emitter/mod.ts";
import { DispatchEvents } from "./gateway/types.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";

interface Client {
  on(name: DispatchEvents, handler: (data: any) => any): ClientEventTarget;
  addListener(name: DispatchEvents, handler: (data: any) => any): ClientEventTarget;
}

class Client extends EventEmitter {
  private token: string;
  private ws = new WebsocketShard(this.token, this);

  public constructor(private token = Deno.env().TOKEN || "") { }

  public connect(): Promise<void> {
    return this.ws.connect();
  }
}

export default Client;
