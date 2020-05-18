import { EventEmitter } from "./deps.ts";
import { Gateway } from "./@types/denocord.ts";
import WebsocketShard from "./gateway/WebsocketShard.ts";
import { ClientOptions } from "./ClientOptions.ts";
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

  public constructor(
    private token: string,
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
    if (!this.gatewayURL) {
      const { url, session_start_limit: ssl } = await this.requestHandler
        .request("GET", `/gateway/bot`);
      if (!ssl.remaining) {
        throw new Error(
          `Starting the bot would reset the token. Please restart the bot after ${ssl.reset_after}ms`,
        );
      }
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
