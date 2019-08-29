import WSShard from "./gateway/WebsocketShard.ts";
import { DispatchEvents } from "./gateway/types.ts";
import EE from "https://deno.land/x/event_emitter/mod.ts";
class Client extends EE implements ClientEventTarget {
  private token: string;
  private ws: WSShard;

  public constructor(token?: string) {
    super();
    this.token = token || Deno.env().TOKEN;
    this.ws = new WSShard(this.token, this);
  }

  public async connect() {
    await this.ws.connect();
  }
}
export default Client;

interface ClientEventTarget {
  on(name: DispatchEvents, handler: (data: any) => any): ClientEventTarget;
  addListener(name: DispatchEvents, handler: (data: any) => any): ClientEventTarget;
}