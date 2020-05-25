import { EventEmitter, StrictEventEmitter } from "../deps.ts";
import { bus, setToken } from "../client.ts";

interface WebsocketEvents {
  raw: string;
  message: { messageStub: true };
}

type StrictEECtor = {
  new (): StrictEventEmitter<EventEmitter, WebsocketEvents>;
};

class WebsocketShard extends (EventEmitter as StrictEECtor) {
  public token?: string;

  private static instance: WebsocketShard;

  public static get() {
    return this.instance ?? (this.instance = new WebsocketShard());
  }

  // This redundant constructor ensures that it can not be initialised with new.
  private constructor() {
    super();
  }

  public login(token: string) {
    bus.emit("debug", "Logging in.");
    this.token = token;
    setToken(token);
  }
}

export default WebsocketShard;
