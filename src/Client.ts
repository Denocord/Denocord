import { EventEmitter } from "./deps.ts";
import { Gateway } from "./@types/denocord.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";
import { ClientOptions } from "./ClientOptions.ts";
import { API_BASE } from "./lib/constants.ts";

interface Client {
  on(name: Gateway.DispatchEvents, handler: (...data: any[]) => void): this;
  addListener(
    name: Gateway.DispatchEvents,
    handler: (...data: any[]) => void,
  ): this;
  emit(name: Gateway.DispatchEvents, ...data: any[]): boolean;
}

class Client extends EventEmitter {
  private ws = new WebsocketShard(this.token, this);
  public gatewayURL: string = "";
  public options: ClientOptions;

  // TODO(Z): This may have implications on boot times.
  public constructor(
    private token = Deno.env.get("TOKEN") || "",
    options?: ClientOptions,
  ) {
    super();
    this.options = {
      compress: false,
      ...(options || {}),
    };
  }

  public async connect(): Promise<void> {
    // TODO: implement proper ratelimiting support

    if (!this.gatewayURL) {
      const { url } = await fetch(`${API_BASE}/gateway`).then((r) => r.json());
      this.gatewayURL = `${url}?v=6&encoding=json${
        this.options.compressStream ? `&compress=zlib-stream` : ""
      }`;
    }
    return this.ws.connect();
  }

  public async setActivity(activity: object): Promise<void> {
    if (this.ws.status === "ready") {
      await this.ws.sendActivity(activity);
    }
  }
}

export default Client;
