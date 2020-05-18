import { EventEmitter } from "./deps.ts";
import { Gateway } from "./@types/denocord.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";
import { ClientOptions } from "./ClientOptions.ts";
import { API_BASE } from "./lib/constants.ts";
import RequestHandler from "./rest/RequestHandler.ts";

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
  public requestHandler = new RequestHandler(this);

  // TODO(Z): This may have implications on boot times.
  public constructor(
    // personally this should be handled by the user themselves - TTtie
    private token = Deno.env.get("TOKEN") || "",
    public options: ClientOptions = {
      compress: false,
      compressStream: true,
      intents: undefined,
    },
  ) {
    super();
    if (!token.startsWith("Bot ")) this.token = `Bot ${this.token}`;
  }

  public async connect(): Promise<void> {
    // TODO: implement proper ratelimiting support

    if (!this.gatewayURL) {
      const { url } = await this.requestHandler.request("GET", `/gateway`);
      this.gatewayURL = `${url}?v=6&encoding=json${
        this.options.compressStream ? `&compress=zlib-stream` : ""
      }`;
    }
    return this.ws.connect();
  }

  public createMessage(channelID: string, content: any): Promise<object> {
    return <Promise<object>> this.requestHandler.request(
      "POST",
      `/channels/${channelID}/messages`,
      true,
      content,
    );
  }

  public async setActivity(activity: object): Promise<void> {
    if (this.ws.status === "ready") {
      await this.ws.sendActivity(activity);
    }
  }
}

export default Client;
